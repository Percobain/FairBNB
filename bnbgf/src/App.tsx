import '@rainbow-me/rainbowkit/styles.css';
import { useAccount } from 'wagmi';
import './App.css';
import { GreenfieldExample } from './components/GreenfieldExample';
import { Wallet } from './components/wallet';

function App() {
  const {isConnected} = useAccount();
  
  return (
    <>
      <Wallet />
      {isConnected && <GreenfieldExample /> }
    </>
  )
}

export default App
