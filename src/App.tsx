import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { Layout } from './components/Layout';
import { ChatbotWidget } from './components/ChatbotWidget';
import { ProtectedRoute, AdminRoute, SuperAdminRoute } from './components/ProtectedRoute';

// Lazy load pages to optimize performance
const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })));
const ProductsPage = lazy(() => import('./pages/ProductsPage').then((m) => ({ default: m.ProductsPage })));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const SignupPage = lazy(() => import('./pages/SignupPage').then((m) => ({ default: m.SignupPage })));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const SellNewPage = lazy(() => import('./pages/SellNewPage').then((m) => ({ default: m.SellNewPage })));
const MyListingsPage = lazy(() => import('./pages/MyListingsPage').then((m) => ({ default: m.MyListingsPage })));
const WishlistPage = lazy(() => import('./pages/WishlistPage').then((m) => ({ default: m.WishlistPage })));
const MessagesPage = lazy(() => import('./pages/MessagesPage').then((m) => ({ default: m.MessagesPage })));
const OrdersPage = lazy(() => import('./pages/OrdersPage').then((m) => ({ default: m.OrdersPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage').then((m) => ({ default: m.NotificationsPage })));
const HelpPage = lazy(() => import('./pages/HelpPage').then((m) => ({ default: m.HelpPage })));
const CartPage = lazy(() => import('./pages/CartPage').then((m) => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));
const UnauthorizedPage = lazy(() => import('./pages/UnauthorizedPage').then((m) => ({ default: m.UnauthorizedPage })));
const OfflinePage = lazy(() => import('./pages/OfflinePage').then((m) => ({ default: m.OfflinePage })));

// New Production Pages
const PricingPage = lazy(() => import('./pages/PricingPage').then((m) => ({ default: m.PricingPage })));
const SubscriptionPage = lazy(() => import('./pages/SubscriptionPage').then((m) => ({ default: m.SubscriptionPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const SupportPage = lazy(() => import('./pages/SupportPage').then((m) => ({ default: m.SupportPage })));
const TermsPage = lazy(() => import('./pages/TermsPage').then((m) => ({ default: m.TermsPage })));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage').then((m) => ({ default: m.PrivacyPage })));
const RefundPolicyPage = lazy(() => import('./pages/RefundPolicyPage').then((m) => ({ default: m.RefundPolicyPage })));
const SellerPolicyPage = lazy(() => import('./pages/SellerPolicyPage').then((m) => ({ default: m.SellerPolicyPage })));
const BuyerPolicyPage = lazy(() => import('./pages/BuyerPolicyPage').then((m) => ({ default: m.BuyerPolicyPage })));
const CommunityPage = lazy(() => import('./pages/CommunityPage').then((m) => ({ default: m.CommunityPage })));
const CookiePolicyPage = lazy(() => import('./pages/CookiePolicyPage').then((m) => ({ default: m.CookiePolicyPage })));

const SafetyCenterPage = lazy(() => import('./pages/SafetyCenterPage').then((m) => ({ default: m.SafetyCenterPage })));
const IdentityVerificationPage = lazy(() => import('./pages/IdentityVerificationPage').then((m) => ({ default: m.IdentityVerificationPage })));
const PaymentSuccessPage = lazy(() => import('./pages/PaymentSuccessPage').then((m) => ({ default: m.PaymentSuccessPage })));
const PaymentFailedPage = lazy(() => import('./pages/PaymentFailedPage').then((m) => ({ default: m.PaymentFailedPage })));

// Admin pages
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage })));
const AdminProductsPage = lazy(() => import('./pages/admin/AdminProductsPage').then((m) => ({ default: m.AdminProductsPage })));
const AdminVerificationsPage = lazy(() => import('./pages/admin/AdminVerificationsPage').then((m) => ({ default: m.AdminVerificationsPage })));
const AdminIdentityVerificationPage = lazy(() => import('./pages/admin/AdminIdentityVerificationPage').then((m) => ({ default: m.AdminIdentityVerificationPage })));
const AdminCategoriesPage = lazy(() => import('./pages/admin/AdminCategoriesPage').then((m) => ({ default: m.AdminCategoriesPage })));
const AdminReportsPage = lazy(() => import('./pages/admin/AdminReportsPage').then((m) => ({ default: m.AdminReportsPage })));
const AdminOrdersPage = lazy(() => import('./pages/admin/AdminOrdersPage').then((m) => ({ default: m.AdminOrdersPage })));
const AdminContentPage = lazy(() => import('./pages/admin/AdminContentPage').then((m) => ({ default: m.AdminContentPage })));

// Super Admin pages
const SuperAdminLayout = lazy(() => import('./pages/superadmin/SuperAdminLayout').then((m) => ({ default: m.SuperAdminLayout })));
const PlatformHealthPage = lazy(() => import('./pages/superadmin/PlatformHealthPage').then((m) => ({ default: m.PlatformHealthPage })));
const AdminManagementPage = lazy(() => import('./pages/superadmin/AdminManagementPage').then((m) => ({ default: m.AdminManagementPage })));
const RoleManagementPage = lazy(() => import('./pages/superadmin/RoleManagementPage').then((m) => ({ default: m.RoleManagementPage })));
const SystemSettingsPage = lazy(() => import('./pages/superadmin/SystemSettingsPage').then((m) => ({ default: m.SystemSettingsPage })));
const SecurityCenterPage = lazy(() => import('./pages/superadmin/SecurityCenterPage').then((m) => ({ default: m.SecurityCenterPage })));
const SuperAdminEntryPage = lazy(() => import('./pages/superadmin/SuperAdminEntryPage').then((m) => ({ default: m.SuperAdminEntryPage })));
const UserManagementPage = lazy(() => import('./pages/superadmin/UserManagementPage').then((m) => ({ default: m.UserManagementPage })));
const ProductModerationPage = lazy(() => import('./pages/superadmin/ProductModerationPage').then((m) => ({ default: m.ProductModerationPage })));
const ContentModerationPage = lazy(() => import('./pages/superadmin/ContentModerationPage').then((m) => ({ default: m.ContentModerationPage })));
const DatabaseStatusPage = lazy(() => import('./pages/superadmin/DatabaseStatusPage').then((m) => ({ default: m.DatabaseStatusPage })));
const HomepageBuilderPage = lazy(() => import('./pages/superadmin/HomepageBuilderPage').then((m) => ({ default: m.HomepageBuilderPage })));
const BannerManagementPage = lazy(() => import('./pages/superadmin/BannerManagementPage').then((m) => ({ default: m.BannerManagementPage })));
const BlogManagementPage = lazy(() => import('./pages/superadmin/BlogManagementPage').then((m) => ({ default: m.BlogManagementPage })));
const AnnouncementCenterPage = lazy(() => import('./pages/superadmin/AnnouncementCenterPage').then((m) => ({ default: m.AnnouncementCenterPage })));
const MediaLibraryPage = lazy(() => import('./pages/superadmin/MediaLibraryPage').then((m) => ({ default: m.MediaLibraryPage })));
const SeoPage = lazy(() => import('./pages/superadmin/SeoPage').then((m) => ({ default: m.SeoPage })));
const CrmPage = lazy(() => import('./pages/superadmin/CrmPage').then((m) => ({ default: m.CrmPage })));
const CouponsPage = lazy(() => import('./pages/superadmin/CouponsPage').then((m) => ({ default: m.CouponsPage })));
const ReferralsPage = lazy(() => import('./pages/superadmin/ReferralsPage').then((m) => ({ default: m.ReferralsPage })));
const NewsletterPage = lazy(() => import('./pages/superadmin/NewsletterPage').then((m) => ({ default: m.NewsletterPage })));

import { useToast } from './components/ui/Toast';

export default function App() {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if the link has an error (like expired or already used link)
    if (window.location.hash.includes('error=')) {
      const params = new URLSearchParams(window.location.hash.substring(1));
      const description = params.get('error_description') || 'This password reset link is invalid or has expired.';
      toast(description.replace(/\+/g, ' '), 'error');
      // Clean up hash from URL
      window.history.replaceState(null, '', window.location.pathname);
      navigate('/forgot-password');
      return;
    }

    // Automatically redirect to reset-password page if recovery token is present in the URL hash
    if (window.location.hash.includes('type=recovery') || window.location.hash.includes('access_token=')) {
      navigate('/reset-password');
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/reset-password');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const loadingSkeleton = (
    <div className="flex justify-center items-center h-[60vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
    </div>
  );

  return (
    <Layout>
      <Suspense fallback={loadingSkeleton}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/help" element={<HelpPage />} />
          
          {/* New Public Production Routes */}
          <Route path="/pricing" element={<PricingPage />} />

          <Route path="/safety" element={<SafetyCenterPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/refund-policy" element={<RefundPolicyPage />} />
          <Route path="/seller-policy" element={<SellerPolicyPage />} />
          <Route path="/buyer-policy" element={<BuyerPolicyPage />} />
          <Route path="/community-guidelines" element={<CommunityPage />} />
          <Route path="/cookie-policy" element={<CookiePolicyPage />} />

          {/* Authenticated */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/kyc" element={<ProtectedRoute><IdentityVerificationPage /></ProtectedRoute>} />
          <Route path="/verify-identity" element={<ProtectedRoute><IdentityVerificationPage /></ProtectedRoute>} />
          <Route path="/sell/new" element={<ProtectedRoute><SellNewPage /></ProtectedRoute>} />
          <Route path="/sell/:id/edit" element={<ProtectedRoute><SellNewPage /></ProtectedRoute>} />
          <Route path="/my-listings" element={<ProtectedRoute><MyListingsPage /></ProtectedRoute>} />
          <Route path="/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
          <Route path="/messages/:conversationId" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
          
          {/* Payment Gateway Routes */}
          <Route path="/payment/success" element={<PaymentSuccessPage />} />
          <Route path="/payment/fail" element={<PaymentFailedPage status="failed" />} />
          <Route path="/payment/cancel" element={<PaymentFailedPage status="cancelled" />} />
          
          {/* New Auth Production Routes */}
          <Route path="/subscription" element={<ProtectedRoute><SubscriptionPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          
          <Route path="/403" element={<UnauthorizedPage />} />
          <Route path="/offline" element={<OfflinePage />} />

          {/* Admin */}
          <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
          <Route path="/admin/products" element={<AdminRoute><AdminProductsPage /></AdminRoute>} />
          <Route path="/admin/verifications" element={<AdminRoute><AdminVerificationsPage /></AdminRoute>} />
          <Route path="/admin/identity-verifications" element={<AdminRoute><AdminIdentityVerificationPage /></AdminRoute>} />
          <Route path="/admin/categories" element={<AdminRoute><AdminCategoriesPage /></AdminRoute>} />
          <Route path="/admin/reports" element={<AdminRoute><AdminReportsPage /></AdminRoute>} />
          <Route path="/admin/orders" element={<AdminRoute><AdminOrdersPage /></AdminRoute>} />
          <Route path="/admin/content" element={<AdminRoute><AdminContentPage /></AdminRoute>} />

          {/* Super Admin */}
          <Route path="/superadmin" element={<SuperAdminEntryPage />} />
          <Route path="/superadmin/users" element={<SuperAdminRoute><SuperAdminLayout><UserManagementPage /></SuperAdminLayout></SuperAdminRoute>} />
          <Route path="/superadmin/admins" element={<SuperAdminRoute><SuperAdminLayout><AdminManagementPage /></SuperAdminLayout></SuperAdminRoute>} />
          <Route path="/superadmin/products" element={<SuperAdminRoute><SuperAdminLayout><ProductModerationPage /></SuperAdminLayout></SuperAdminRoute>} />
          <Route path="/superadmin/content" element={<SuperAdminRoute><SuperAdminLayout><ContentModerationPage /></SuperAdminLayout></SuperAdminRoute>} />
          <Route path="/superadmin/roles" element={<SuperAdminRoute><SuperAdminLayout><RoleManagementPage /></SuperAdminLayout></SuperAdminRoute>} />
          <Route path="/superadmin/settings" element={<SuperAdminRoute><SuperAdminLayout><SystemSettingsPage /></SuperAdminLayout></SuperAdminRoute>} />
          <Route path="/superadmin/security" element={<SuperAdminRoute><SuperAdminLayout><SecurityCenterPage /></SuperAdminLayout></SuperAdminRoute>} />
          <Route path="/superadmin/database" element={<SuperAdminRoute><SuperAdminLayout><DatabaseStatusPage /></SuperAdminLayout></SuperAdminRoute>} />
          <Route path="/superadmin/homepage" element={<SuperAdminRoute><SuperAdminLayout><HomepageBuilderPage /></SuperAdminLayout></SuperAdminRoute>} />
          <Route path="/superadmin/banners" element={<SuperAdminRoute><SuperAdminLayout><BannerManagementPage /></SuperAdminLayout></SuperAdminRoute>} />
          <Route path="/superadmin/blogs" element={<SuperAdminRoute><SuperAdminLayout><BlogManagementPage /></SuperAdminLayout></SuperAdminRoute>} />
          <Route path="/superadmin/announcements" element={<SuperAdminRoute><SuperAdminLayout><AnnouncementCenterPage /></SuperAdminLayout></SuperAdminRoute>} />
          <Route path="/superadmin/media" element={<SuperAdminRoute><SuperAdminLayout><MediaLibraryPage /></SuperAdminLayout></SuperAdminRoute>} />
          <Route path="/superadmin/seo" element={<SuperAdminRoute><SuperAdminLayout><SeoPage /></SuperAdminLayout></SuperAdminRoute>} />
          <Route path="/superadmin/crm" element={<SuperAdminRoute><SuperAdminLayout><CrmPage /></SuperAdminLayout></SuperAdminRoute>} />
          <Route path="/superadmin/coupons" element={<SuperAdminRoute><SuperAdminLayout><CouponsPage /></SuperAdminLayout></SuperAdminRoute>} />
          <Route path="/superadmin/referrals" element={<SuperAdminRoute><SuperAdminLayout><ReferralsPage /></SuperAdminLayout></SuperAdminRoute>} />
          <Route path="/superadmin/newsletter" element={<SuperAdminRoute><SuperAdminLayout><NewsletterPage /></SuperAdminLayout></SuperAdminRoute>} />

          {/* Catch-all 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      <ChatbotWidget />
    </Layout>
  );
}
