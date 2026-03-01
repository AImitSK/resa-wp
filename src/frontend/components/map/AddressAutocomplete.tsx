/**
 * AddressAutocomplete — Dropdown with address search suggestions.
 *
 * Uses the useAddressSearch hook for debounced geocoding queries.
 * Can be bounded to a specific city/region.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { __ } from '@wordpress/i18n';
import { useAddressSearch, type UseAddressSearchOptions } from '../../hooks/useAddressSearch';
import type { AddressData, GeocodingResult, AddressBounds } from '../../types/address';

interface AddressAutocompleteProps {
	/** Current value (display name) */
	value?: string;
	/** Callback when an address is selected */
	onSelect: (address: AddressData | null) => void;
	/** Bound search to a specific region */
	boundTo?: AddressBounds;
	/** Placeholder text */
	placeholder?: string;
	/** Error message */
	error?: string;
	/** Disabled state */
	disabled?: boolean;
	/** Additional CSS class */
	className?: string;
}

/**
 * Convert a geocoding result to AddressData format.
 */
function resultToAddressData(result: GeocodingResult): AddressData {
	return {
		displayName: result.display_name,
		street: undefined, // Nominatim doesn't return street separately
		postalCode: result.postal_code ?? undefined,
		city: result.city ?? undefined,
		lat: result.lat,
		lng: result.lng,
	};
}

export function AddressAutocomplete({
	value = '',
	onSelect,
	boundTo,
	placeholder,
	error,
	disabled = false,
	className = '',
}: AddressAutocompleteProps) {
	const [inputValue, setInputValue] = useState(value);
	const [isOpen, setIsOpen] = useState(false);
	const [highlightedIndex, setHighlightedIndex] = useState(-1);

	const containerRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const searchOptions: UseAddressSearchOptions = {
		minLength: 3,
		debounce: 300,
		boundTo,
		radius: 10, // Smaller radius for more localized results
	};

	const {
		results,
		isLoading,
		error: searchError,
		clearResults,
	} = useAddressSearch(inputValue, searchOptions);

	// Track previous results length to detect new results.
	const prevResultsLengthRef = useRef(0);

	// Open dropdown when results arrive — using ref to avoid eslint warning.
	// This is a valid use case: synchronizing UI state with external data.
	useEffect(() => {
		const hadNoResults = prevResultsLengthRef.current === 0;
		const hasResultsNow = results.length > 0;
		prevResultsLengthRef.current = results.length;

		if (hadNoResults && hasResultsNow && inputValue.length >= 3) {
			// eslint-disable-next-line react-hooks/set-state-in-effect -- Valid: syncing UI with external search results
			setIsOpen(true);
			setHighlightedIndex(-1);
		}
	}, [results, inputValue]);

	// Close dropdown on outside click.
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const newValue = e.target.value;
			setInputValue(newValue);

			// Clear selection if user is typing.
			if (newValue.length < 3) {
				setIsOpen(false);
				clearResults();
			}
		},
		[clearResults],
	);

	const handleSelect = useCallback(
		(result: GeocodingResult) => {
			const addressData = resultToAddressData(result);
			setInputValue(addressData.displayName);
			setIsOpen(false);
			clearResults();
			onSelect(addressData);
		},
		[onSelect, clearResults],
	);

	const handleClear = useCallback(() => {
		setInputValue('');
		setIsOpen(false);
		clearResults();
		onSelect(null);
		inputRef.current?.focus();
	}, [onSelect, clearResults]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (!isOpen || results.length === 0) {
				return;
			}

			switch (e.key) {
				case 'ArrowDown':
					e.preventDefault();
					setHighlightedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
					break;
				case 'ArrowUp':
					e.preventDefault();
					setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
					break;
				case 'Enter':
					e.preventDefault();
					if (highlightedIndex >= 0 && highlightedIndex < results.length) {
						handleSelect(results[highlightedIndex]);
					}
					break;
				case 'Escape':
					e.preventDefault();
					setIsOpen(false);
					break;
			}
		},
		[isOpen, results, highlightedIndex, handleSelect],
	);

	const displayError = error || searchError;

	return (
		<div ref={containerRef} className={`resa-address-autocomplete ${className}`}>
			<div className="resa-address-autocomplete__input-wrapper">
				{/* Search icon */}
				<span className="resa-address-autocomplete__icon">
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<circle cx="11" cy="11" r="8" />
						<path d="m21 21-4.3-4.3" />
					</svg>
				</span>

				<input
					ref={inputRef}
					type="text"
					value={inputValue}
					onChange={handleInputChange}
					onKeyDown={handleKeyDown}
					onFocus={() => results.length > 0 && setIsOpen(true)}
					placeholder={placeholder || __('Straße und Hausnummer eingeben…', 'resa')}
					disabled={disabled}
					className="resa-address-autocomplete__input"
					autoComplete="off"
					aria-label={__('Adresssuche', 'resa')}
					aria-expanded={isOpen}
					aria-haspopup="listbox"
					aria-autocomplete="list"
				/>

				{/* Loading spinner */}
				{isLoading && (
					<span className="resa-address-autocomplete__spinner">
						<svg
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
						>
							<path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
						</svg>
					</span>
				)}

				{/* Clear button */}
				{inputValue && !isLoading && (
					<button
						type="button"
						onClick={handleClear}
						className="resa-address-autocomplete__clear"
						aria-label={__('Eingabe löschen', 'resa')}
					>
						<svg
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="M18 6 6 18M6 6l12 12" />
						</svg>
					</button>
				)}
			</div>

			{/* Error message */}
			{displayError && (
				<p className="resa-address-autocomplete__error" role="alert">
					{displayError}
				</p>
			)}

			{/* Results dropdown */}
			{isOpen && results.length > 0 && (
				<ul
					className="resa-address-autocomplete__dropdown"
					role="listbox"
					aria-label={__('Adressvorschläge', 'resa')}
				>
					{results.map((result, index) => (
						<li
							key={`${result.lat}-${result.lng}`}
							role="option"
							aria-selected={index === highlightedIndex}
							className={`resa-address-autocomplete__option ${
								index === highlightedIndex
									? 'resa-address-autocomplete__option--highlighted'
									: ''
							}`}
							onClick={() => handleSelect(result)}
							onMouseEnter={() => setHighlightedIndex(index)}
						>
							<span className="resa-address-autocomplete__option-icon">
								<svg
									width="14"
									height="14"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
									<circle cx="12" cy="10" r="3" />
								</svg>
							</span>
							<span className="resa-address-autocomplete__option-text">
								{result.display_name}
							</span>
						</li>
					))}
				</ul>
			)}

			{/* No results message */}
			{isOpen &&
				inputValue.length >= 3 &&
				!isLoading &&
				results.length === 0 &&
				!searchError && (
					<div className="resa-address-autocomplete__no-results">
						{__('Keine Adressen gefunden', 'resa')}
					</div>
				)}

			<style>{`
				.resa-address-autocomplete {
					position: relative;
					width: 100%;
				}

				.resa-address-autocomplete__input-wrapper {
					position: relative;
					display: flex;
					align-items: center;
				}

				.resa-address-autocomplete__icon {
					position: absolute;
					left: 12px;
					color: hsl(var(--resa-muted-foreground));
					pointer-events: none;
					display: flex;
					align-items: center;
				}

				.resa-address-autocomplete__input {
					width: 100%;
					padding: 10px 40px 10px 40px;
					font-size: 14px;
					border: 1px solid hsl(var(--resa-border));
					border-radius: var(--resa-radius);
					background: hsl(var(--resa-background));
					color: hsl(var(--resa-foreground));
					outline: none;
					transition: border-color 0.2s, box-shadow 0.2s;
				}

				.resa-address-autocomplete__input:focus {
					border-color: hsl(var(--resa-primary));
					box-shadow: 0 0 0 2px hsl(var(--resa-primary) / 0.2);
				}

				.resa-address-autocomplete__input:disabled {
					opacity: 0.5;
					cursor: not-allowed;
				}

				.resa-address-autocomplete__input::placeholder {
					color: hsl(var(--resa-muted-foreground));
				}

				.resa-address-autocomplete__spinner {
					position: absolute;
					right: 12px;
					color: hsl(var(--resa-muted-foreground));
					display: flex;
					align-items: center;
					animation: resa-spin 1s linear infinite;
				}

				@keyframes resa-spin {
					from { transform: rotate(0deg); }
					to { transform: rotate(360deg); }
				}

				.resa-address-autocomplete__clear {
					position: absolute;
					right: 12px;
					background: none;
					border: none;
					padding: 4px;
					cursor: pointer;
					color: hsl(var(--resa-muted-foreground));
					display: flex;
					align-items: center;
					border-radius: 4px;
					transition: color 0.2s, background-color 0.2s;
				}

				.resa-address-autocomplete__clear:hover {
					color: hsl(var(--resa-foreground));
					background-color: hsl(var(--resa-muted));
				}

				.resa-address-autocomplete__error {
					margin-top: 4px;
					font-size: 12px;
					color: hsl(var(--resa-destructive));
				}

				.resa-address-autocomplete__dropdown {
					position: absolute;
					top: 100%;
					left: 0;
					right: 0;
					z-index: 50;
					margin-top: 4px;
					padding: 4px 0;
					background: hsl(var(--resa-background));
					border: 1px solid hsl(var(--resa-border));
					border-radius: var(--resa-radius);
					box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
					list-style: none;
					max-height: 240px;
					overflow-y: auto;
				}

				.resa-address-autocomplete__option {
					display: flex;
					align-items: flex-start;
					gap: 10px;
					padding: 10px 12px;
					cursor: pointer;
					transition: background-color 0.15s;
				}

				.resa-address-autocomplete__option:hover,
				.resa-address-autocomplete__option--highlighted {
					background-color: hsl(var(--resa-muted));
				}

				.resa-address-autocomplete__option-icon {
					flex-shrink: 0;
					color: hsl(var(--resa-primary));
					margin-top: 2px;
				}

				.resa-address-autocomplete__option-text {
					font-size: 13px;
					line-height: 1.4;
					color: hsl(var(--resa-foreground));
				}

				.resa-address-autocomplete__no-results {
					padding: 12px;
					font-size: 13px;
					color: hsl(var(--resa-muted-foreground));
					text-align: center;
				}
			`}</style>
		</div>
	);
}
