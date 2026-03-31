import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';

export default function EditPageContent() {
  console.log('EditPageContent component rendered');
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const [content, setContent] = useState('');

  useEffect(() => {
    const fetchContent = async () => {
      console.log('Fetching content for pageId:', pageId);
      if (!pageId) {
        console.log('No pageId provided');
        return;
      }
      try {
        const docRef = doc(db, 'page_content', pageId);
        console.log('DocRef created');
        const docSnap = await getDoc(docRef);
        console.log('DocSnap fetched, exists:', docSnap.exists());
        if (docSnap.exists()) {
          setContent(docSnap.data().content);
        }
      } catch (error) {
        console.error('Error fetching content:', error);
        toast.error('Failed to load content');
      }
    };
    fetchContent();
  }, [pageId]);

  const handleSave = async () => {
    if (!pageId) return;
    try {
      await setDoc(doc(db, 'page_content', pageId), {
        id: pageId,
        title: pageId,
        content
      });
      toast.success('Content saved successfully');
      navigate('/admin?tab=pages');
    } catch (error) {
      console.error('Error saving content:', error);
      toast.error('Failed to save content');
    }
  };

  return (
    <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate('/admin?tab=pages')} className="flex items-center gap-2 text-gray-500 hover:text-gray-900">
          <ArrowLeft size={20} />
          Back
        </button>
        <h2 className="text-lg font-bold text-gray-900">Edit {pageId} Policy</h2>
        <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600">
          <Save size={20} />
          Save
        </button>
      </div>
      <textarea
        className="w-full h-96 p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Enter page content here..."
      />
    </div>
  );
}
