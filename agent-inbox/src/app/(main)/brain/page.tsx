import { MemoryView } from "@/components/agent-inbox/memory-view";

export default function BrainPage() {
    return (
        <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">
            <MemoryView />
        </div>
    );
}
