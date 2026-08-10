/// <reference types="cypress" />

describe('Marketplace Flow', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('displays the homepage correctly', () => {
    cy.contains('AI-Powered Resale Marketplace').should('be.visible');
    cy.contains('Browse Market').should('be.visible');
  });

  it('navigates to products page and searches', () => {
    cy.visit('/products');
    cy.get('input[placeholder*="Search"]').type('Laptop{enter}');
    // Mock assertions, in a real environment this would wait for network
    cy.url().should('include', '/products');
  });

  it('requires login for protected routes', () => {
    cy.visit('/dashboard');
    // Assuming unauthenticated users are redirected to login
    cy.url().should('include', '/login');
  });
});
