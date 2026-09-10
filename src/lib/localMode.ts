// Both the browser and API must be loopback, and this is never enabled in a production build.
const loopback = (hostname: string) => ['127.0.0.1', 'localhost', '[::1]'].includes(hostname);
const requested = import.meta.env.DEV && import.meta.env.VITE_LOCAL_TEST === 'true';
const apiUrl = new URL(import.meta.env.VITE_API_BASE_URL || '/', window.location.origin);
if (requested && (!loopback(window.location.hostname) || !loopback(apiUrl.hostname))) {
  throw new Error('로컬 테스트 모드는 로컬 웹·API 주소에서만 실행할 수 있습니다.');
}
export const localTestMode = requested;
