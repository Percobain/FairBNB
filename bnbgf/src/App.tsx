import '@rainbow-me/rainbowkit/styles.css';
import { useAccount } from 'wagmi';
import './App.css';
import { Demo } from './components/demo';
import { Wallet } from './components/wallet';

function App() {
  const {isConnected} = useAccount();
  
  return (
    <>
      <Wallet />
      {isConnected && <Demo /> }
    </>
  )
}

export default App
