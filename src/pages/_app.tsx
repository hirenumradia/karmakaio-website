import { AudioProvider } from '@/components/context/AudioContext'
import type { AppProps } from 'next/app'
import 'src/styles/global.css'
import Head from 'next/head'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:title" content="Karmakaio 👽 DJ/Producer ❤ Sending Positive Vibes In The Universe ❤" />
        <meta property="og:description" content="DJ/Producer (Suported by BBC Radio, NRK and So Track Boa)." />
        <meta property="og:image" content="/assets/images/og-image.jpg" />
        <meta property="og:url" content="https://www.karmakaio.com" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Karmakaio 👽 DJ/Producer ❤ Sending Positive Vibes In The Universe ❤" />
        <meta name="twitter:description" content="DJ/Producer (Suported by BBC Radio, NRK and So Track Boa)." />
        <meta name="twitter:image" content="/assets/images/og-image.jpg" />
        <meta name="description" content="DJ/Producer (Suported by BBC Radio, NRK and So Track Boa)." />
        <title>Karmakaio 👽 DJ/Producer ❤ Sending Positive Vibes In The Universe ❤</title>
      </Head>
      <AudioProvider><Component {...pageProps} /></AudioProvider>
    </>
  )
}

export default MyApp