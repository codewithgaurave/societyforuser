// src/routes/index.jsx
import { lazy } from "react";
import {
  FaUsers,
  FaTachometerAlt,
  FaBolt,
  FaCity,
  FaImages,
  FaCalendarAlt,
  FaObjectGroup, // 👈 NEW icon for Main Categories
} from "react-icons/fa";

const SocietyDashboard = lazy(() => import("../pages/SocietyDashboard"));
const ServiceCategoryPage = lazy(() =>
  import("../pages/ServiceCategoryPage")
);
const UserManagementPage = lazy(() =>
  import("../pages/UserManagementPage")
);
const TatkalServicePage = lazy(() =>
  import("../pages/TatkalServicePage")
);
const ColonyManagementPage = lazy(() =>
  import("../pages/ColonyManagementPage")
);
const SliderManagementPage = lazy(() =>
  import("../pages/SliderManagementPage")
);
const AvailabilityPage = lazy(() =>
  import("../pages/AvailabilityPage")
);

// 👇 NEW — Main Category Page
const MainCategoryPage = lazy(() =>
  import("../pages/MainCategoryPage")
);

const routes = [
  {
    path: "/dashboard",
    component: SocietyDashboard,
    name: "Dashboard",
    icon: FaTachometerAlt,
  },
  {
    path: "/service-categories",
    component: ServiceCategoryPage,
    name: "Service Categories",
    icon: FaUsers,
  },

  // 👇 NEW — Main Categories route
  {
    path: "/main-categories",
    component: MainCategoryPage,
    name: "Main Categories",
    icon: FaObjectGroup,
  },

  {
    path: "/users",
    component: UserManagementPage,
    name: "Users",
    icon: FaUsers,
  },

  // ⭐ Tatkal Services Page
  {
    path: "/tatkal-services",
    component: TatkalServicePage,
    name: "Tatkal Services",
    icon: FaBolt,
  },

  {
    path: "/colonies",
    component: ColonyManagementPage,
    name: "Colonies",
    icon: FaCity,
  },

  {
    path: "/sliders",
    component: SliderManagementPage,
    name: "Sliders",
    icon: FaImages,
  },

  {
    path: "/availability",
    component: AvailabilityPage,
    name: "Availability",
    icon: FaCalendarAlt,
  },
];

export default routes;
