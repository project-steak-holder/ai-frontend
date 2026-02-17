import { useState } from 'react';
import { Button } from '../ui/button';
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

export function ConversationSidebar() {
  const [conversations] = useState([
    { id: 1, title: 'Convo 1' },
    { id: 2, title: 'Convo 2' },
    { id: 3, title: 'Convo 3' },
    { id: 4, title: 'Convo 4' },
    { id: 5, title: 'Convo 5' },
  ]);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');

  const handleCreate = () => {
    if (title.trim()) {
      console.log('New conversation:', title);
      setTitle('');
    }
    setOpen(false);
  };

  return (
    <div className="h-full w-64 flex flex-col border-r border-gray-200 bg-white">
      <div className="flex-1 p-4 space-y-2 overflow-y-auto">
        {conversations.map((conv) => (
          <div
            key={conv.id}
            className="px-3 py-2 text-sm rounded-lg hover:bg-gray-100 cursor-pointer"
          >
            {conv.title}
          </div>
        ))}
      </div>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="m-4 w-full">New</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter a new conversation name?</DialogTitle>
            <DialogDescription>
              Give your conversation a descriptive name.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Requirements Elicitation with Product Owner"
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
