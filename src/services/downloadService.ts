
import { fetchBridge } from './memberService';

export interface DownloadItem {
  id: string;
  title: string;
  shortcode: string;
  author: string;
  category: string;
  date: string;
  fileUrl?: string;
  downloadCount: number;
}

export const fetchDownloads = async (page: number = 1, search: string = '', limit: number = 20) => {
  const res = await fetchBridge({
    mode: 'list',
    table: 'wpdmpro',
    page,
    search,
    limit
  });

  return {
    data: (res.data || []).map((row: any) => ({
      id: row.ID?.toString(),
      title: row.post_title,
      shortcode: `[wpdm_package id='${row.ID}']`,
      author: row.post_author_name || '관리자',
      category: row.category_name || '-',
      date: row.post_date,
      downloadCount: parseInt(row.download_count || '0'),
      fileUrl: row.file_url || ''
    })),
    total: parseInt(res.total || '0')
  };
};

export const deleteDownload = async (id: string) => {
  return fetchBridge({
    mode: 'delete_record',
    table: 'wp_posts', // WPDM uses wp_posts
    id
  });
};

export const createDownload = async (data: { title: string; fileUrl: string; filename: string }) => {
  return fetchBridge({
    mode: 'save_download',
    data: {
      title: data.title,
      file_url: data.fileUrl,
      filename: data.filename
    }
  });
};

export const updateDownload = async (data: { id: string; title: string; fileUrl?: string }) => {
  return fetchBridge({
    mode: 'update_download',
    data: {
      id: data.id,
      title: data.title,
      file_url: data.fileUrl
    }
  });
};

export const pinDownload = async (id: string, pin: boolean) => {
  return fetchBridge({
    mode: 'pin_download',
    data: { id, pin }
  });
};


