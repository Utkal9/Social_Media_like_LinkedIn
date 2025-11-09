import { store } from "@/config/redux/store.js";
import "@/styles/globals.css";
import { Provider } from "react-redux";
import Head from "next/head";

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
                <title>Pro Connect</title>
            </Head>
            <Provider store={store}>
                {getLayout(<Component {...pageProps} />)}
            </Provider>
        </>
    );
}
