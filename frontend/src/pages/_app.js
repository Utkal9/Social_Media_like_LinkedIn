import { store } from "@/config/redux/store.js";
import "@/styles/globals.css";
import { Provider } from "react-redux";
import Head from "next/head";
import { SocketProvider } from "@/context/SocketContext";
import { ThemeProvider } from "@/context/ThemeContext"; // <--- IMPORT THIS

export default function App({ Component, pageProps }) {
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
                {/* --- THEME PROVIDER MUST BE HERE --- */}
                <ThemeProvider>
                    <SocketProvider>
                        {getLayout(<Component {...pageProps} />)}
                    </SocketProvider>
                </ThemeProvider>
            </Provider>
        </>
    );
}
