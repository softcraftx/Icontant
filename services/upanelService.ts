import { Category, Subcategory, SeoResult } from '../types';

const BASE_URL = '/api/upanel';

export const fetchCategories = async (websiteId: string): Promise<Category[]> => {
  try {
    const response = await fetch(`${BASE_URL}/categories?websiteId=${websiteId}`);
    if (!response.ok) throw new Error('Failed to fetch categories');
    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

export const fetchSubcategories = async (parentId: number, websiteId: string): Promise<Subcategory[]> => {
  try {
    const response = await fetch(`${BASE_URL}/categories/${parentId}/subcategories?websiteId=${websiteId}`);
    if (!response.ok) throw new Error('Failed to fetch subcategories');
    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    return [];
  }
};

export const postArticleToUpanel = async (
  seoResult: SeoResult,
  categoryId: number,
  subcategoryId?: number,
  status: number = 0 // 0 = Draft
) => {
  try {
    const payload = {
      title: seoResult.seoTitle,
      summary: seoResult.metaDescription,
      content: seoResult.articleContent,
      category_id: categoryId,
      subcategory_id: subcategoryId || null,
      keywords: seoResult.metaKeywords,
      tags: seoResult.websiteTags.join(', '),
      status: status,
      post_type: 'article',
      lang_id: 1, // Default to 1
      topic: seoResult.topic,
      website_name: seoResult.website_name
    };

    const response = await fetch(`${BASE_URL}/articles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to post article');
    }

    return await response.json();
  } catch (error) {
    console.error('Error posting article:', error);
    throw error;
  }
};
