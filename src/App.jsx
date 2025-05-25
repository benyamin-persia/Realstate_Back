import HomePage from "./routes/homePage/homePage";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import ListPage from "./routes/listPage/listPage";
import { Layout, RequireAuth } from "./routes/layout/layout";
import SinglePage from "./routes/singlePage/singlePage";
import ProfilePage from "./routes/profilePage/profilePage";
import Login from "./routes/login/login";
import Register from "./routes/register/register";
import ProfileUpdatePage from "./routes/profileUpdatePage/profileUpdatePage";
import NewPostPage from "./routes/newPostPage/newPostPage";
import AdminPage from "./routes/adminPage/adminPage";
import UserPosts from "./routes/adminPage/UserPosts";
import { listPageLoader, profilePageLoader, singlePageLoader } from "./lib/loaders";
import apiRequest from "./lib/apiRequest";
import ProfileError from "./routes/profilePage/ProfileError";

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Layout />,
      children: [
        {
          path: "/",
          element: <HomePage />,
        },
        {
          path: "/list",
          element: <ListPage />,
          loader: listPageLoader,
        },
        {
          path: "/login",
          element: <Login />,
        },
        {
          path: "/register",
          element: <Register />,
        },
        {
          path: "/:id",
          element: <SinglePage />,
          loader: singlePageLoader,
        },
      ],
    },
    {
      path: "/",
      element: <RequireAuth />,
      children: [
        {
          path: "/profile",
          element: <ProfilePage />,
          loader: profilePageLoader,
          errorElement: <ProfileError />
        },
        {
          path: "/profile/update",
          element: <ProfileUpdatePage />,
        },
        {
          path: "/add",
          element: <NewPostPage />,
        },
        {
          path: "/admin",
          element: <AdminPage />,
        },
        {
          path: "/admin/user/:userId/posts",
          element: <UserPosts />,
        },
        {
          path: "/user/:userId/posts",
          element: <ListPage />,
          loader: async ({ params }) => {
            const response = await apiRequest.get(`/users/${params.userId}/posts`);
            return { postResponse: Promise.resolve(response) };
          }
        },
      ],
    },
  ]);

  return <RouterProvider router={router} />;
}

export default App;
