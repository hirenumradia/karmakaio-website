import { AudioProvider } from '@/components/context/AudioContext'
import type { AppProps } from 'next/app'
import 'src/styles/global.css'

function MyApp({ Component, pageProps }: AppProps) {
  return <AudioProvider><Component {...pageProps} /></AudioProvider>
}

export default MyApp