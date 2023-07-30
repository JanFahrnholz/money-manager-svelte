import ContactsCreatePage from "../pages/contacts/contact-create.svelte";
import ContactDetailsLinkedPage from "../pages/contacts/contact-details-linked.svelte";
import ContactDetailsPage from "../pages/contacts/contact-details.svelte";
import ContactsPage from "../pages/contacts/contacts.svelte";
import { f7 } from "framework7-svelte";
import { client } from "../pocketbase";

export const contactRoutes = [
  {
    path: "/contacts/",
    component: ContactsPage,
  },
  {
    path: "/contacts/create/",
    component: ContactsCreatePage,
  },
  {
    path: "/contacts/:id/",
    async: async ({ app, to, resolve }) => {
      const loader = setTimeout(() => f7.dialog.preloader(), 300);

      try {
        const { id } = to.params;
        const contact = await client.collection("contacts").getOne(id);
        const transactions = await client
          .collection("transactions")
          .getFullList({
            filter: `contact="${id}"`,
            sort: "-date",
            expand: "contact,owner",
          });

        resolve(
          {
            component:
              contact.owner === client.authStore.model?.id
                ? ContactDetailsPage
                : ContactDetailsLinkedPage,
          },
          {
            props: {
              contact,
              transactions,
            },
          }
        );
      } catch (error) {
        const toast = f7.toast.create({
          text: "Could not load contact details",
          position: "bottom",
          closeTimeout: 2000,
        });
        toast.open();
        resolve("/");
      } finally {
        clearTimeout(loader);
        f7.dialog.close();
      }
    },
  },
];
