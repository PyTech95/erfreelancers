import re
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field
from pymongo.errors import DuplicateKeyError

from auth import get_current_admin
from store import db, NO_ID, now_iso, rand_id

router = APIRouter(prefix='/api')


class PostBody(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)
    title: str = Field(min_length=3, max_length=160)
    slug: str = Field(default='', max_length=180, pattern=r'^[a-z0-9-]*$')
    excerpt: str = Field(default='', max_length=400)
    content: str = Field(min_length=10, max_length=60000)
    author: str = Field(default='ER Freelancer', min_length=1, max_length=100)
    category: str = Field(default='Insights', min_length=1, max_length=60)
    status: Literal['draft', 'published'] = 'draft'


class Post(PostBody):
    id: str
    createdAt: str
    updatedAt: str
    publishedAt: Optional[str] = None


class PostList(BaseModel):
    posts: list[Post]
    total: int


class DeleteResponse(BaseModel):
    success: bool


async def init_blog():
    await db.blog_posts.create_index('id', unique=True)
    await db.blog_posts.create_index('slug', unique=True)
    await db.blog_posts.create_index([('status', 1), ('publishedAt', -1)])


@router.get('/admin/blog', response_model=PostList)
async def admin_posts(_=Depends(get_current_admin)):
    return PostList(posts=await db.blog_posts.find({}, NO_ID).sort('updatedAt', -1).limit(500).to_list(500),
                    total=await db.blog_posts.count_documents({}))


@router.get('/blog', response_model=PostList)
async def public_posts(page: int = Query(1, ge=1), limit: int = Query(12, ge=1, le=50)):
    query = {'status': 'published'}
    return PostList(posts=await db.blog_posts.find(query, NO_ID).sort('publishedAt', -1).skip((page - 1) * limit).limit(limit).to_list(limit),
                    total=await db.blog_posts.count_documents(query))


@router.get('/blog/{slug}', response_model=Post)
async def public_post(slug: str):
    post = await db.blog_posts.find_one({'slug': slug, 'status': 'published'}, NO_ID)
    if not post:
        raise HTTPException(404, 'Post not found')
    return Post(**post)


async def save_post(body, old=None):
    now = now_iso()
    data = body.model_dump()
    data['slug'] = data['slug'] or re.sub(r'[^a-z0-9]+', '-', data['title'].lower()).strip('-')[:170]
    if not data['slug'] or not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', data['slug']):
        raise HTTPException(400, 'Use a URL slug with letters, numbers and single hyphens.')
    data.update(id=old['id'] if old else rand_id('post'), createdAt=old['createdAt'] if old else now, updatedAt=now,
                publishedAt=((old or {}).get('publishedAt') or now) if data['status'] == 'published' else None)
    try:
        await db.blog_posts.update_one({'id': data['id']}, {'$set': data}, upsert=True)
    except DuplicateKeyError:
        raise HTTPException(409, 'This blog URL is already in use. Choose another slug.') from None
    return Post(**data)


@router.post('/admin/blog', response_model=Post, status_code=201)
async def create_post(body: PostBody, _=Depends(get_current_admin)):
    return await save_post(body)


@router.put('/admin/blog/{post_id}', response_model=Post)
async def update_post(post_id: str, body: PostBody, _=Depends(get_current_admin)):
    old = await db.blog_posts.find_one({'id': post_id}, NO_ID)
    if not old:
        raise HTTPException(404, 'Post not found')
    return await save_post(body, old)


@router.delete('/admin/blog/{post_id}', response_model=DeleteResponse)
async def delete_post(post_id: str, _=Depends(get_current_admin)):
    result = await db.blog_posts.delete_one({'id': post_id})
    if not result.deleted_count:
        raise HTTPException(404, 'Post not found')
    return DeleteResponse(success=True)