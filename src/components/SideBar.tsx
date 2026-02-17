import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function SideBar() {
  const [conversations] = useState([
    { id: 1, title: 'Convo 1' },
    { id: 2, title: 'Convo 2' },
  ]);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');

  return (
    <div className="h-full w-64 flex flex-col border-r border-gray-200 bg-white">
      <div className="flex-1 p-4 space-y-2 overflow-y-auto">
        {conversations.map((conv) => (
          <div key={conv.id} className="px-3 py-2 text-sm rounded-lg hover:bg-gray-100 cursor-pointer">
            {conv.title}
          </div>
        ))}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="m-4 w-full">New Conversation</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Conversation</DialogTitle>
            <DialogDescription>Name your conversation</DialogDescription>
          </DialogHeader>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          <DialogFooter>
            <Button onClick={() => { console.log(title); setOpen(false); }}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
