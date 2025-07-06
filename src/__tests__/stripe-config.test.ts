import { describe, it, expect } from 'vitest';
import { stripeProducts, getProductByPriceId, getProductById } from '../stripe-config';

describe('stripe-config', () => {
  it('exports correct number of products', () => {
    expect(stripeProducts).toHaveLength(2);
  });

  it('has correct product structure', () => {
    const product = stripeProducts[0];
    
    expect(product).toHaveProperty('id');
    expect(product).toHaveProperty('priceId');
    expect(product).toHaveProperty('name');
    expect(product).toHaveProperty('description');
    expect(product).toHaveProperty('mode');
    expect(product).toHaveProperty('price');
    expect(product).toHaveProperty('currency');
    expect(product).toHaveProperty('features');
  });

  it('finds product by price ID', () => {
    const priceId = 'price_1RdEUUFzbUfm7BYRYrWGFeIX';
    const product = getProductByPriceId(priceId);
    
    expect(product).toBeDefined();
    expect(product?.priceId).toBe(priceId);
    expect(product?.name).toBe('Monthly Plan');
  });

  it('finds product by product ID', () => {
    const productId = 'prod_SYLCKiifxqz0cE';
    const product = getProductById(productId);
    
    expect(product).toBeDefined();
    expect(product?.id).toBe(productId);
    expect(product?.name).toBe('Yearly Plan');
  });

  it('returns undefined for non-existent price ID', () => {
    const product = getProductByPriceId('non-existent-price-id');
    expect(product).toBeUndefined();
  });

  it('returns undefined for non-existent product ID', () => {
    const product = getProductById('non-existent-product-id');
    expect(product).toBeUndefined();
  });

  it('has correct pricing information', () => {
    const monthlyPlan = getProductByPriceId('price_1RdEUUFzbUfm7BYRYrWGFeIX');
    const yearlyPlan = getProductByPriceId('price_1RdEVlFzbUfm7BYRWpZ2CXVR');
    
    expect(monthlyPlan?.price).toBe('€3.49');
    expect(monthlyPlan?.interval).toBe('month');
    expect(monthlyPlan?.currency).toBe('eur');
    
    expect(yearlyPlan?.price).toBe('€34.99');
    expect(yearlyPlan?.interval).toBe('year');
    expect(yearlyPlan?.currency).toBe('eur');
  });

  it('has subscription mode for all products', () => {
    stripeProducts.forEach(product => {
      expect(product.mode).toBe('subscription');
    });
  });

  it('has features array for all products', () => {
    stripeProducts.forEach(product => {
      expect(Array.isArray(product.features)).toBe(true);
      expect(product.features.length).toBeGreaterThan(0);
    });
  });
});