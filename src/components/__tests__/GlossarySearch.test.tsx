import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import GlossarySearch from '../GlossarySearch/index';

describe('GlossarySearch Component', () => {
  beforeEach(() => {
    // Setup some dummy DOM elements that mimic the glossary items
    document.body.innerHTML = `
      <div class="glossary-term" data-term="api">
        <h3>API</h3>
        <p>Application Programming Interface.</p>
      </div>
      <div class="glossary-term" data-term="cold start">
        <h3>Cold Start</h3>
        <p>The initialization latency.</p>
      </div>
      <div class="glossary-term" data-term="edge function">
        <h3>Edge Function</h3>
        <p>A piece of programmable logic running on Azion Edge Nodes.</p>
      </div>
    `;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders the search input with correct placeholder', () => {
    render(<GlossarySearch />);
    const input = screen.getByPlaceholderText('Search glossary terms...');
    expect(input).toBeInTheDocument();
  });

  it('initially shows all glossary terms', () => {
    render(<GlossarySearch />);
    const terms = document.querySelectorAll('.glossary-term');
    terms.forEach(term => {
      expect((term as HTMLElement).style.display).not.toBe('none');
    });
  });

  it('filters terms based on data-term correctly (match)', () => {
    render(<GlossarySearch />);
    const input = screen.getByPlaceholderText('Search glossary terms...');
    
    // Type "cold" to match "cold start"
    fireEvent.change(input, { target: { value: 'cold' } });
    
    const apiTerm = document.querySelector('[data-term="api"]') as HTMLElement;
    const coldStartTerm = document.querySelector('[data-term="cold start"]') as HTMLElement;
    const edgeFunctionTerm = document.querySelector('[data-term="edge function"]') as HTMLElement;
    
    expect(coldStartTerm.style.display).not.toBe('none');
    expect(apiTerm.style.display).toBe('none');
    expect(edgeFunctionTerm.style.display).toBe('none');
  });

  it('filters terms based on paragraph content correctly (match)', () => {
    render(<GlossarySearch />);
    const input = screen.getByPlaceholderText('Search glossary terms...');
    
    // Type "latency" to match paragraph inside "cold start"
    fireEvent.change(input, { target: { value: 'latency' } });
    
    const apiTerm = document.querySelector('[data-term="api"]') as HTMLElement;
    const coldStartTerm = document.querySelector('[data-term="cold start"]') as HTMLElement;
    const edgeFunctionTerm = document.querySelector('[data-term="edge function"]') as HTMLElement;
    
    expect(coldStartTerm.style.display).not.toBe('none');
    expect(apiTerm.style.display).toBe('none');
    expect(edgeFunctionTerm.style.display).toBe('none');
  });

  it('shows no terms and displays the empty state if search query matches nothing', () => {
    render(<GlossarySearch />);
    const input = screen.getByPlaceholderText('Search glossary terms...');
    
    fireEvent.change(input, { target: { value: 'unknown term that does not exist' } });
    
    const terms = document.querySelectorAll('.glossary-term');
    terms.forEach(term => {
      expect((term as HTMLElement).style.display).toBe('none');
    });
    
    const emptyStateText = screen.getByText('No terms found matching your search.');
    expect(emptyStateText).toBeInTheDocument();
  });

  it('renders custom empty state text when provided', () => {
    render(<GlossarySearch emptyStateText="Nenhum termo encontrado." />);
    const input = screen.getByRole('textbox');
    
    fireEvent.change(input, { target: { value: 'xyz123' } });
    
    const emptyStateText = screen.getByText('Nenhum termo encontrado.');
    expect(emptyStateText).toBeInTheDocument();
  });

  it('shows all terms when search is cleared after being typed', () => {
    render(<GlossarySearch />);
    const input = screen.getByPlaceholderText('Search glossary terms...');
    
    fireEvent.change(input, { target: { value: 'api' } });
    
    const apiTerm = document.querySelector('[data-term="api"]') as HTMLElement;
    const coldStartTerm = document.querySelector('[data-term="cold start"]') as HTMLElement;
    expect(apiTerm.style.display).not.toBe('none');
    expect(coldStartTerm.style.display).toBe('none');
    
    expect(screen.queryByText('No terms found matching your search.')).not.toBeInTheDocument();
    
    // Clear search
    fireEvent.change(input, { target: { value: '' } });
    
    expect(apiTerm.style.display).not.toBe('none');
    expect(coldStartTerm.style.display).not.toBe('none'); // assuming '' means empty string, not 'none'
  });
});
