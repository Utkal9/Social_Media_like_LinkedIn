import { store } from "@/config/redux/store.js";
import "@/styles/globals.css";
import { Provider } from "react-redux";
import Head from "next/head";
import { SocketProvider } from "@/context/SocketContext";

export default function App({ Component, pageProps }) {
    // Get a layout function from the page component, if it exists.
    // Otherwise, just render the page.
    const getLayout = Component.getLayout || ((page) => page);

    return (
        <>
            <Head>
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />
                <title>LinkUps</title>
                <link
                    rel="icon"
                    href="https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=1440,h=756,fit=crop,f=jpeg/A3Q7xGO4EOc9ZVJo/chatgpt-image-aug-11-2025-10_04_14-pm-YleQ8RV01OtW9GKv.png"
                    type="image/png"
                />
            </Head>
            <Provider store={store}>
                <SocketProvider>
                    {getLayout(<Component {...pageProps} />)}
                </SocketProvider>
            </Provider>
        </>
    );
}
