/**
 * Telegram WebApp Mock для локальной разработки
 * Активируется через VITE_TG_MOCK=true
 */

interface MockUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

const MOCK_USERS: Record<string, MockUser> = {
  admin: {
    id: 123456789,
    first_name: 'Admin',
    last_name: 'User',
    username: 'admin_test',
    language_code: 'ru',
  },
  editor: {
    id: 987654321,
    first_name: 'Editor',
    last_name: 'User',
    username: 'editor_test',
    language_code: 'uz',
  },
  viewer: {
    id: 555666777,
    first_name: 'Viewer',
    last_name: 'User',
    username: 'viewer_test',
    language_code: 'ru',
  },
};

export function initTelegramMock() {
  if (import.meta.env.VITE_TG_MOCK !== 'true') {
    return; // Mock отключен
  }

  console.log('[TG MOCK] Инициализация Telegram WebApp Mock режима');

  // Выбираем пользователя из localStorage или используем admin по умолчанию
  const mockUserType = localStorage.getItem('mock_user_type') || 'admin';
  const mockUser = MOCK_USERS[mockUserType] || MOCK_USERS.admin;

  console.log('[TG MOCK] Активный пользователь:', mockUserType, mockUser);

  // Создаём mock Telegram.WebApp
  const mockWebApp = {
    initData: 'mock_init_data',
    initDataUnsafe: {
      user: mockUser,
      query_id: 'mock_query_id',
      auth_date: Math.floor(Date.now() / 1000),
      hash: 'mock_hash',
    },
    ready: () => console.log('[TG MOCK] ready()'),
    expand: () => console.log('[TG MOCK] expand()'),
    close: () => console.log('[TG MOCK] close()'),
    MainButton: {
      text: '',
      color: '#1E6FDB',
      textColor: '#FFFFFF',
      isVisible: false,
      isActive: true,
      isProgressVisible: false,
      setText: (text: string) => console.log('[TG MOCK] MainButton.setText:', text),
      onClick: (_callback: () => void) => console.log('[TG MOCK] MainButton.onClick registered'),
      offClick: (_callback: () => void) => console.log('[TG MOCK] MainButton.offClick registered'),
      show: () => console.log('[TG MOCK] MainButton.show()'),
      hide: () => console.log('[TG MOCK] MainButton.hide()'),
      enable: () => console.log('[TG MOCK] MainButton.enable()'),
      disable: () => console.log('[TG MOCK] MainButton.disable()'),
      showProgress: () => console.log('[TG MOCK] MainButton.showProgress()'),
      hideProgress: () => console.log('[TG MOCK] MainButton.hideProgress()'),
      setParams: (params: Record<string, unknown>) => console.log('[TG MOCK] MainButton.setParams:', params),
    },
    onEvent: (eventName: string, _callback: () => void) => {
      console.log('[TG MOCK] onEvent:', eventName);
      // Можно симулировать события при необходимости
    },
    offEvent: (eventName: string, _callback: () => void) => {
      console.log('[TG MOCK] offEvent:', eventName);
    },
  };

  // Добавляем mock в window
  (window as any).Telegram = {
    WebApp: mockWebApp,
  };

  console.log('[TG MOCK] Telegram.WebApp инициализирован');

  // Добавляем UI для переключения пользователей (только в dev режиме)
  if (import.meta.env.DEV) {
    addMockUserSwitcher();
  }
}

function addMockUserSwitcher() {
  // Создаём плавающую панель переключения пользователей
  const switcher = document.createElement('div');
  switcher.id = 'tg-mock-switcher';
  switcher.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 15px;
    border-radius: 12px;
    z-index: 10000;
    font-family: monospace;
    font-size: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    min-width: 200px;
  `;

  switcher.innerHTML = `
    <div style="margin-bottom: 10px; font-weight: bold; color: #1E6FDB;">🤖 TG Mock Mode</div>
    <select id="mock-user-select" style="width: 100%; padding: 5px; margin-bottom: 10px; border-radius: 4px;">
      <option value="admin">Admin User</option>
      <option value="editor">Editor User</option>
      <option value="viewer">Viewer User</option>
    </select>
    <button id="mock-user-apply" style="width: 100%; padding: 5px; background: #1E6FDB; color: white; border: none; border-radius: 4px; cursor: pointer;">
      Apply & Reload
    </button>
    <div style="margin-top: 10px; font-size: 10px; opacity: 0.7;">
      Current: ${localStorage.getItem('mock_user_type') || 'admin'}
    </div>
  `;

  document.body.appendChild(switcher);

  // Устанавливаем текущее значение
  const select = document.getElementById('mock-user-select') as HTMLSelectElement;
  if (select) {
    select.value = localStorage.getItem('mock_user_type') || 'admin';
  }

  // Обработчик применения
  const applyBtn = document.getElementById('mock-user-apply');
  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      const selectedUser = (document.getElementById('mock-user-select') as HTMLSelectElement).value;
      localStorage.setItem('mock_user_type', selectedUser);
      window.location.reload();
    });
  }
}

// Функция для проверки, активен ли mock режим
export function isTelegramMockEnabled(): boolean {
  return import.meta.env.VITE_TG_MOCK === 'true';
}

// Функция для получения mock пользователя (для тестов)
export function getMockUser(): MockUser | null {
  if (!isTelegramMockEnabled()) return null;
  const mockUserType = localStorage.getItem('mock_user_type') || 'admin';
  return MOCK_USERS[mockUserType] || null;
}
