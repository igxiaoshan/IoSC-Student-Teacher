const DifyService = require('../../services/difyService');

// Mock axios
jest.mock('axios');

describe('DifyService', () => {
  let difyService;

  beforeEach(() => {
    difyService = new DifyService();
    // 重置环境变量
    process.env.DIFY_API_URL = 'https://api.dify.ai';
    process.env.DIFY_API_KEY = 'test-api-key';
    difyService.baseURL = process.env.DIFY_API_URL;
    difyService.apiKey = process.env.DIFY_API_KEY;
  });

  describe('ResponseCache', () => {
    it('should cache and retrieve values', () => {
      const cache = difyService.responseCache;
      const key = 'test-key';
      const value = { data: 'test-data' };

      cache.set(key, value);
      const retrieved = cache.get(key);

      expect(retrieved).toEqual(value);
    });

    it('should return null for expired cache', () => {
      const cache = difyService.responseCache;
      cache.ttl = 100; // 100ms TTL

      cache.set('key', 'value');

      // 等待过期
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(cache.get('key')).toBeNull();
    });

    it('should clear cache', () => {
      const cache = difyService.responseCache;
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      cache.clear();

      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
    });
  });

  describe('checkHealth', () => {
    it('should return false when config is incomplete', async () => {
      difyService.baseURL = null;
      difyService.apiKey = null;

      const result = await difyService.checkHealth();

      expect(result).toBe(false);
    });

    it('should return true when service is available', async () => {
      const axios = require('axios');
      axios.post.mockResolvedValueOnce({ status: 200 });

      const result = await difyService.checkHealth();

      expect(result).toBe(true);
    });

    it('should return false on server error', async () => {
      const axios = require('axios');
      axios.post.mockResolvedValueOnce({ status: 500 });

      const result = await difyService.checkHealth();

      expect(result).toBe(false);
    });
  });

  describe('generateMockResponse', () => {
    it('should generate mock lesson plan', async () => {
      const result = await difyService.generateMockLessonPlanResponse({
        courseName: 'Math',
        subject: 'Mathematics'
      });

      expect(result.success).toBe(true);
      expect(result.source).toBe('mock');
      expect(result.data).toBeDefined();
    });

    it('should generate mock assessment', async () => {
      const result = await difyService.generateMockAssessmentResponse({
        assessment_title: 'Test Exam',
        subject_name: 'Math'
      });

      expect(result.success).toBe(true);
      expect(result.source).toBe('mock');
      expect(result.data).toBeDefined();
    });
  });

  describe('getServiceInfo', () => {
    it('should return service configuration info', () => {
      const info = difyService.getServiceInfo();

      expect(info).toHaveProperty('configured');
      expect(info).toHaveProperty('baseURL');
      expect(info).toHaveProperty('hasApiKey');
    });
  });

  describe('callDifyAPI', () => {
    it('should handle API errors gracefully', async () => {
      const axios = require('axios');
      axios.post.mockRejectedValueOnce(new Error('Network error'));

      await expect(difyService.callDifyAPI('/test', {}))
        .rejects.toThrow('Network error');
    });

    it('should retry on failure', async () => {
      const axios = require('axios');
      axios.post
        .mockRejectedValueOnce(new Error('First failure'))
        .mockResolvedValueOnce({ data: { success: true } });

      const result = await difyService.callDifyAPI('/test', {});

      expect(result).toBeDefined();
    });
  });
});