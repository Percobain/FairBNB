import { useAccount } from 'wagmi';
import './App.css';
import { Demo } from './components/demo';
import { Wallet } from './components/wallet';

function App() {
  const {isConnected} = useAccount()
  return (
    <div className="App">
      <header className="App-header">
        <Wallet />
        {isConnected && <Demo /> }
      </header>
    </div>
  );
}

export default App;
