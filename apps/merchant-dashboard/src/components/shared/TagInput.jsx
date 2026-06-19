import { useState } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';

/**
 * Tag Input Component
 *
 * Add/remove tags by typing and pressing Enter or comma
 */
const TagInput = ({ tags = [], onChange, placeholder = 'Add tag and press Enter' }) => {
  const [input, setInput] = useState('');

  const addTag = (value) => {
    const trimmed = value.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput('');
  };

  const removeTag = (tag) => {
    onChange(tags.filter((t) => t !== tag));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div className="w-full rounded-lg border border-gray-300 bg-white p-2 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-200 transition-all">
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-md"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:bg-primary-200 rounded p-0.5 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => input && addTag(input)}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm placeholder:text-gray-400 px-2 py-1"
        />
      </div>
    </div>
  );
};

export default TagInput;