import Login from "./auth/components/login.svelte";
import Register from "./auth/components/register.svelte";
import { contactRoutes } from "./contacts/routes";
import NotFoundPage from "./pages/404.svelte";
import Contacts from "./pages/contacts/contacts.svelte";
import Home from "./pages/home.svelte";
import HomePage from "./pages/home.svelte";
import Main from "./pages/main.svelte";
import Profile from "./pages/profile.svelte";
import SettingsPage from "./pages/profile.svelte";
import { transactionRoutes } from "./transactions/routes";

var routes = [
  {
    path: "/",
    component: Main,
  },
  ...contactRoutes,
  ...transactionRoutes,
  {
    path: "/create-id/",
    component: Register,
  },
  {
    path: "(.*)",
    component: NotFoundPage,
  },
];

export default routes;
