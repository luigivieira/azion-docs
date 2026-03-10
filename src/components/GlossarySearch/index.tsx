import React, { useState, useEffect } from 'react';
import styles from './styles.module.css';

interface GlossarySearchProps {
  placeholder?: string;
  emptyStateText?: string;
}

export default function GlossarySearch({ 
  placeholder = "Search glossary terms...",
  emptyStateText = "No terms found matching your search."
}: GlossarySearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [hasResults, setHasResults] = useState(true);

  useEffect(() => {
    const terms = document.querySelectorAll('.glossary-term');
    const query = searchTerm.toLowerCase().trim();
    let foundAny = false;

    terms.forEach((termElement) => {
      const termName = termElement.getAttribute('data-term')?.toLowerCase() || '';
      const termContent = termElement.textContent?.toLowerCase() || '';
      
      if (query === '' || termName.includes(query) || termContent.includes(query)) {
        (termElement as HTMLElement).style.display = '';
        foundAny = true;
      } else {
        (termElement as HTMLElement).style.display = 'none';
      }
    });

    setHasResults(query === '' || foundAny);
  }, [searchTerm]);

  return (
    <>
      <div className={styles.searchContainer}>
      <svg className={styles.searchIcon} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
      </svg>
      <input
        type="text"
        className={styles.searchInput}
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        aria-label="Search glossary"
      />
    </div>
    {!hasResults && (
      <div className={styles.emptyState} style={{ padding: '2rem', textAlign: 'center', color: 'var(--ifm-color-emphasis-700)', backgroundColor: 'var(--ifm-color-emphasis-100)', borderRadius: 'var(--ifm-global-radius)', marginTop: '1rem' }}>
        <p style={{ margin: 0, fontWeight: 500 }}>{emptyStateText}</p>
      </div>
    )}
    </>
  );
}
