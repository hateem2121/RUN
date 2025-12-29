import { Route, Switch } from "wouter";
import FloatingDockHeader from "./components/navigation/floating-dock-header";
import BackToTop from "./components/ui/back-to-top";
import AboutPage from "./pages/about";
import AccessoriesPage from "./pages/accessories";
import AdminPage from "./pages/admin";
import AnalyticsPage from "./pages/analytics";
import CategoriesPage from "./pages/categories";
import CategoryDetailPage from "./pages/category-detail";
import CategoryProductsPage from "./pages/category-products";
import CertificationsPage from "./pages/certifications";
import ContactPage from "./pages/contact";
import DashboardPage from "./pages/dashboard";
import FabricsPage from "./pages/fabrics";
import FibersPage from "./pages/fibers";
// Page Imports
import HomePage from "./pages/home";
import ManufacturingPage from "./pages/manufacturing";
import ProductsPage from "./pages/products";
import ResourcesPage from "./pages/resources";
import ServicesPage from "./pages/services";
import SizeChartsPage from "./pages/size-charts";
import SustainabilityPage from "./pages/sustainability";
import TechnologyPage from "./pages/technology";

const App = () => {
  return (
    <>
      <FloatingDockHeader />
      <Switch>
        {/* Public Routes */}
        <Route path="/" component={HomePage} />
        <Route path="/technology" component={TechnologyPage} />
        <Route path="/about" component={AboutPage} />
        <Route path="/contact" component={ContactPage} />
        <Route path="/manufacturing" component={ManufacturingPage} />
        <Route path="/sustainability" component={SustainabilityPage} />
        <Route path="/products" component={ProductsPage} />
        <Route path="/categories" component={CategoriesPage} />
        <Route path="/categories/:slug" component={CategoryDetailPage} />
        <Route path="/category/:slug/products" component={CategoryProductsPage} />
        <Route path="/accessories" component={AccessoriesPage} />
        <Route path="/certifications" component={CertificationsPage} />
        <Route path="/fabrics" component={FabricsPage} />
        <Route path="/fibers" component={FibersPage} />
        <Route path="/analytics" component={AnalyticsPage} />
        <Route path="/dashboard" component={DashboardPage} />
        <Route path="/size-charts" component={SizeChartsPage} />
        <Route path="/services" component={ServicesPage} />
        <Route path="/resources" component={ResourcesPage} />

        {/* Admin Routes */}
        <Route path="/admin/:module?" component={AdminPage} />

        {/* Catch-all 404 */}
        <Route>
          <div className="flex h-screen items-center justify-center bg-background text-foreground">
            404 - Not Found
          </div>
        </Route>
      </Switch>
      <BackToTop />
    </>
  );
};

export default App;
