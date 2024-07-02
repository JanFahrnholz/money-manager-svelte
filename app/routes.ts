import { contactRoutes } from "./contacts/routes";
import NotFoundPage from "./pages/404.svelte";
import Register from "./user/components/register.svelte";
import Main from "./pages/main.svelte";
import { transactionRoutes } from "./transactions/routes";
import { client, clientId } from "./pocketbase";
import ManagerPage from "./components/pages/manager-page.svelte";
import CourierPage from "./components/pages/courier-page.svelte";
import { f7 } from "framework7-svelte";

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
    path: "/manager/:id/",
    async: async ({ app, to, resolve }) => {
      const loader = setTimeout(() => f7.dialog.preloader(), 300);
      const { id } = to.params;

      try {
        const courier = await client.collection("couriers").getOne(id, {
          expand:
            "contacts_via_courier,transactions_via_courier,transactions_via_courier.contact",
        });
        const contact = courier.expand?.contacts_via_courier[0];
        const transactions = await client.collection("transactions").getFullList({
          filter: `contact="${contact.id}" && (type="Restock" || type="Collect" || type="Redeem")`
        })

        if(Array.isArray(courier.expand?.transactions_via_courier)){
          transactions.push(...courier.expand?.transactions_via_courier)
        }
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date))
  
        resolve(
          {
            component:
              clientId === contact.owner ? CourierPage : ManagerPage,
          },
          {
            props: { courier, transactions },
          }
        );
      } catch (error) {
        resolve("/");
      }finally {
        clearTimeout(loader);
        f7.dialog.close();
      }
    },
  },
  {
    path: "(.*)",
    component: NotFoundPage,
  },
];

export default routes;
