// Единый API клиент для фронтенда
type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface APIConfig {
  baseURL: string;
  timeout: number;
  retries: number;
}

class APIClient {
  private config: APIConfig;
  private token: string | null = null;

  constructor(config: Partial<APIConfig> = {}) {
    this.config = {
      baseURL: config.baseURL || '/api',
      timeout: config.timeout || 30000,
      retries: config.retries || 3,
    };
    
    // Загружаем токен из localStorage
    this.token = localStorage.getItem('session_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('session_token', token);
    } else {
      localStorage.removeItem('session_token');
    }
  }

  private async request<T>(
    method: HTTPMethod,
    endpoint: string,
    data?: any,
    attempt: number = 1
  ): Promise<T> {
    const url = `${this.config.baseURL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
        credentials: 'include', // для cookies
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new APIError(error.error || 'Request failed', response.status, error);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      // Повтор при ошибке сети
      if (attempt < this.config.retries && error instanceof Error) {
        if (error.name === 'AbortError' || error.message.includes('network')) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          return this.request<T>(method, endpoint, data, attempt + 1);
        }
      }

      if (error instanceof APIError) throw error;
      throw new APIError('Network error', 0, { originalError: error });
    }
  }

  // Методы HTTP
  get<T>(endpoint: string): Promise<T> {
    return this.request<T>('GET', endpoint);
  }

  post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>('POST', endpoint, data);
  }

  put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>('PUT', endpoint, data);
  }

  patch<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>('PATCH', endpoint, data);
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>('DELETE', endpoint);
  }

  // API методы

  // Auth
  async verifyCode(code: string, telegramId?: number, fullName?: string) {
    const response = await this.post<{
      success: boolean;
      token: string;
      user: any;
    }>('/auth/verify-code', {
      code,
      telegram_id: telegramId,
      full_name: fullName,
    });

    if (response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  async logout() {
    this.setToken(null);
    // Можно добавить вызов API для инвалидации токена на сервере
  }

  // Admin - Users
  async getUsers() {
    return this.get<{ users: any[] }>('/admin/users');
  }

  async updateUser(id: string, data: any) {
    return this.patch<{ user: any }>(`/admin/users?id=${id}`, data);
  }

  // Admin - Access Codes
  async getAccessCodes() {
    return this.get<{ codes: any[] }>('/admin/access-codes');
  }

  async createAccessCode(data: any) {
    return this.post<{ code: string; id: string }>('/admin/access-codes', data);
  }

  async deleteAccessCode(id: string) {
    return this.delete(`/admin/access-codes?id=${id}`);
  }

  // Content (можно добавить позже)
  // async getSections() { ... }
  // async createSection(data) { ... }
}

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Singleton instance
export const api = new APIClient();
