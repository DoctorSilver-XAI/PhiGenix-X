import { ChatInterface } from '../components/ChatInterface';

export function Home() {
    return (
        <div className="h-full flex flex-col">
            {/* Small header adjustment if needed, but ChatInterface has its own header */}
            <ChatInterface />
        </div>
    );
}
