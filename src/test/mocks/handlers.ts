import { http, HttpResponse } from 'msw';

export const handlers = [
  // Mock Supabase API calls
  http.post('*/auth/v1/token', () => {
    return HttpResponse.json({
      access_token: 'mock-token',
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: {
          full_name: 'Test User',
        },
      },
    });
  }),

  // Mock Google Drive API
  http.get('https://www.googleapis.com/drive/v3/files', () => {
    return HttpResponse.json({
      files: [
        {
          id: 'folder1',
          name: 'Test Folder',
          mimeType: 'application/vnd.google-apps.folder',
          parents: [],
        },
      ],
    });
  }),

  // Mock Stripe checkout
  http.post('*/functions/v1/stripe-checkout', () => {
    return HttpResponse.json({
      sessionId: 'cs_test_123',
      url: 'https://checkout.stripe.com/pay/cs_test_123',
    });
  }),

  // Mock webhook calls
  http.post('https://alexfinit.app.n8n.cloud/webhook-test/*', () => {
    return HttpResponse.json({ success: true });
  }),
];