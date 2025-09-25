-- Create support messages table
CREATE TABLE public.support_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  sender_name TEXT,
  phone_number TEXT NOT NULL,
  country_code TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  replied_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT
);

-- Enable RLS
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can view all support messages" 
ON public.support_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.user_type = 'admin'
  )
);

CREATE POLICY "Admins can update support messages" 
ON public.support_messages 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.user_type = 'admin'
  )
);

CREATE POLICY "Anyone can create support messages" 
ON public.support_messages 
FOR INSERT 
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_support_messages_updated_at
BEFORE UPDATE ON public.support_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();