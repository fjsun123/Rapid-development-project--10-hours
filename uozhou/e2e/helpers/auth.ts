// E2E 测试辅助工具
import { Page, request } from '@playwright/test';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthHelper {
  private apiContext;

  constructor() {
    this.apiContext = request.newContext({
      baseURL: 'http://localhost:3001',
    });
  }

  /**
   * 通过 API 登录获取 Token（用于测试前置条件）
   */
  async login(phone: string = '13800138000', code: string = '123456'): Promise<AuthTokens> {
    const context = await this.apiContext;

    // 发送验证码
    await context.post('/api/auth/sms/code', { data: { phone } });

    // 登录获取 Token
    const response = await context.post('/api/auth/login', {
      data: { phone, code },
    });

    const data = await response.json();
    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    };
  }

  /**
   * 管理员登录
   */
  async adminLogin(username: string = 'admin', password: string = 'admin123'): Promise<AuthTokens> {
    const context = await this.apiContext;

    const response = await context.post('/api/auth/admin/login', {
      data: { username, password },
    });

    const data = await response.json();
    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    };
  }

  /**
   * 在页面中设置 Token
   */
  async setTokens(page: Page, tokens: AuthTokens) {
    await page.evaluate(([access, refresh]) => {
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
    }, [tokens.accessToken, tokens.refreshToken]);
  }

  /**
   * 完整的测试登录流程
   */
  async loginForTest(page: Page, phone: string = '13800138000'): Promise<AuthTokens> {
    const tokens = await this.login(phone);
    await page.goto('/');
    await this.setTokens(page, tokens);
    return tokens;
  }

  /**
   * 清除页面中的 Token
   */
  async clearTokens(page: Page) {
    await page.evaluate(() => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    });
  }
}

export const authHelper = new AuthHelper();

/**
 * 模拟真人操作的延迟
 */
export async function humanDelay(min: number = 100, max: number = 300) {
  const delay = Math.random() * (max - min) + min;
  await new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * 模拟真人输入
 */
export async function humanType(page: Page, selector: string, text: string) {
  const element = page.locator(selector);
  await element.click();

  for (const char of text) {
    await element.press(char);
    await humanDelay(50, 150);
  }
}

/**
 * 模拟真人点击
 */
export async function humanClick(page: Page, selector: string) {
  await humanDelay();
  const element = page.locator(selector);
  await element.hover();
  await humanDelay(100, 200);
  await element.click();
}

/**
 * 等待页面加载完成
 */
export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForLoadState('domcontentloaded');
}

/**
 * 拍摄截图
 */
export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });
}
