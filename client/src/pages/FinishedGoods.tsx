import { useState } from 'react';
import { PackageCheck, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FinishedGoods() {
  const [productName, setProductName] = useState('');
  const [rmWeight, setRmWeight] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName || !rmWeight) {
      toast.error('Please enter product name and RM weight');
      return;
    }

    setIsSubmitting(true);
    // Mock API call
    setTimeout(() => {
      toast.success('Finished Good saved successfully!');
      setProductName('');
      setRmWeight('');
      setQuantity('1');
      setIsSubmitting(false);
    }, 600);
  };

  return (
    <div className="flex flex-col gap-6 p-2 h-full">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Finished Goods</h1>
      </div>

      <div className="bg-white rounded-xl shadow-[0_2px_15px_rgb(0,0,0,0.04)] border border-slate-100 p-6 w-full lg:w-1/2">
        <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
          <PackageCheck className="text-indigo-600" /> Record New Product
        </h2>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
             <label className="block text-sm font-semibold text-gray-700 mb-1">Product Name / Model</label>
             <input type="text" placeholder="e.g. Aluminum Chassis V2" className="w-full p-2.5 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all" required value={productName} onChange={e => setProductName(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Consumed RM Weight (KG)</label>
                <input type="number" step="any" placeholder="e.g. 15.5" className="w-full p-2.5 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all" required value={rmWeight} onChange={e => setRmWeight(e.target.value)} />
             </div>
             <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Quantity Produced</label>
                <input type="number" min="1" className="w-full p-2.5 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all" required value={quantity} onChange={e => setQuantity(e.target.value)} />
             </div>
          </div>

          <div className="mt-2 flex justify-center w-full">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-8 py-3 bg-[#ede9fe] hover:bg-[#ddd6fe] border border-[#ddd6fe] text-[#312e81] font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-70"
            >
              <Save size={18} /> {isSubmitting ? 'Saving...' : 'Save Finished Good'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
