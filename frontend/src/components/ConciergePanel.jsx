import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useConciergeAgent } from '../hooks/useConcierge';
import { useTravelerDashboard } from '../hooks/useTravelerData';
import { useConciergeContext } from '../context/ConciergeContext.jsx';

const quickPrompts = [
  'Family-friendly weekend getaway with indoor options.',
  'Budget foodie crawl focusing on vegan eateries.',
  'Romantic anniversary itinerary with evening activities.',
  'Accessible highlights with minimal walking and wheelchair access.',
];

const initialFormState = {
  checkIn: '',
  checkOut: '',
  city: '',
  country: '',
  party: '',
  propertyType: '',
  budget: '',
  interests: '',
  mobility: '',
  dietary: '',
  persona: '',
  locale: '',
  query: '',
};

function parseList(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function ConciergeResponseView({ response }) {
  if (!response) {
    return null;
  }
  const activitiesMap = useMemo(() => {
    if (!Array.isArray(response.activities)) {
      return new Map();
    }
    return new Map(response.activities.map((activity) => [activity.id, activity]));
  }, [response.activities]);

  const itinerarySection = useMemo(() => {
    if (!response.itinerary?.length) {
      return null;
    }

    const slots = [
      { key: 'morning', label: 'Morning' },
      { key: 'afternoon', label: 'Afternoon' },
      { key: 'evening', label: 'Evening' },
    ];

    return (
      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-airbnb-charcoal/60">
          Day-by-day plan
        </h3>
        <div className="space-y-4">
          {response.itinerary.map((day, index) => (
            <div key={day.date ?? index} className="rounded-3xl border border-base-200 bg-base-100 p-4">
              <header className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-airbnb-charcoal">
                  Day {index + 1}
                  {day.date ? ` · ${new Date(day.date).toLocaleDateString()}` : ''}
                </p>
              </header>
              <div className="mt-3 grid gap-3">
                {slots.map(({ key, label }) => {
                  const block = day[key];
                  if (!block) return null;
                  const referencedActivities = (block.activity_ids ?? [])
                    .map((id) => activitiesMap.get(id))
                    .filter(Boolean);

                  return (
                    <div key={key} className="rounded-2xl bg-base-200/70 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-airbnb-charcoal/60">
                        {label}
                      </p>
                      <p className="mt-1 text-sm font-medium text-airbnb-charcoal">{block.title}</p>
                      {block.summary ? (
                        <p className="mt-1 text-sm text-airbnb-charcoal/70">{block.summary}</p>
                      ) : null}
                      {referencedActivities.length ? (
                        <ul className="mt-3 space-y-2">
                          {referencedActivities.map((activity) => (
                            <li key={activity.id} className="rounded-xl bg-white p-3 shadow-sm">
                              <p className="text-sm font-semibold text-airbnb-charcoal">{activity.title}</p>
                              {activity.address ? (
                                <p className="text-xs text-airbnb-charcoal/60">{activity.address}</p>
                              ) : null}
                              <div className="mt-1 flex flex-wrap gap-2 text-xs text-airbnb-charcoal/60">
                                {activity.duration ? <span>Duration: {activity.duration}</span> : null}
                                {activity.price_tier ? <span>Price: {activity.price_tier}</span> : null}
                                {activity.accessibility?.wheelchair_friendly ? (
                                  <span>Wheelchair-friendly</span>
                                ) : null}
                                {activity.accessibility?.kid_friendly ? <span>Kid-friendly</span> : null}
                              </div>
                              {activity.tags?.length ? (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {activity.tags.map((tag) => (
                                    <span
                                      key={tag}
                                      className="rounded-full bg-airbnb-primary/10 px-2 py-1 text-[11px] font-medium text-airbnb-primary"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }, [activitiesMap, response.itinerary]);

  const restaurantsSection = useMemo(() => {
    if (!response.restaurants?.length) {
      return null;
    }
    return (
      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-airbnb-charcoal/60">
          Restaurant picks
        </h3>
        <div className="space-y-3">
          {response.restaurants.map((restaurant) => (
            <div key={restaurant.id} className="rounded-2xl border border-base-200 bg-base-100 p-3 shadow-sm">
              <p className="text-sm font-semibold text-airbnb-charcoal">{restaurant.name}</p>
              <div className="mt-1 flex flex-wrap gap-2 text-xs text-airbnb-charcoal/60">
                {restaurant.cuisine ? <span>{restaurant.cuisine}</span> : null}
                {restaurant.price_tier ? <span>Price: {restaurant.price_tier}</span> : null}
                {restaurant.reservation ? <span>Reservation: {restaurant.reservation}</span> : null}
              </div>
              {restaurant.address ? (
                <p className="mt-1 text-xs text-airbnb-charcoal/60">{restaurant.address}</p>
              ) : null}
              {restaurant.dietary_notes?.length ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {restaurant.dietary_notes.map((note) => (
                    <span
                      key={note}
                      className="rounded-full bg-airbnb-secondary/10 px-2 py-1 text-[11px] font-medium text-airbnb-secondary"
                    >
                      {note}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    );
  }, [response.restaurants]);

  const packingSection = useMemo(() => {
    if (!response.packing_checklist?.length) {
      return null;
    }
    return (
      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-airbnb-charcoal/60">
          Packing checklist
        </h3>
        <div className="space-y-3">
          {response.packing_checklist.map((bucket) => (
            <div key={bucket.category} className="rounded-2xl bg-base-200/70 p-3">
              <p className="text-sm font-semibold text-airbnb-charcoal">{bucket.category}</p>
              <ul className="mt-2 space-y-2 text-sm text-airbnb-charcoal/70">
                {bucket.items.map((item) => (
                  <li key={item.item} className="flex gap-2">
                    <span className="font-semibold">{item.must_have ? '[Required]' : '[Optional]'}</span>
                    <span>
                      <span className="font-medium text-airbnb-charcoal">{item.item}</span>
                      {item.reason ? <span className="text-airbnb-charcoal/60"> · {item.reason}</span> : null}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    );
  }, [response.packing_checklist]);

  const insightsSection = useMemo(() => {
    // Only show insights in development mode
    const isDevelopment = import.meta.env.DEV;
    const showInsightsFlag = response.show_insights ?? response.showInsights ?? true;
    
    if (!isDevelopment || !showInsightsFlag || !response.insights) {
      return null;
    }
    const { data_sources, trip_context } = response.insights;
    
    // Only show if there's trip context or data sources
    if (!trip_context && !data_sources?.length) {
      return null;
    }
    
    return (
      <section className="space-y-2">
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-airbnb-charcoal/60">
          Trip context & data sources
        </h3>
        <div className="rounded-3xl border border-base-200 bg-base-100 p-3 text-sm text-airbnb-charcoal/70">
          {trip_context ? (
            <div className="mb-3 space-y-2">
              <p className="font-semibold text-airbnb-charcoal">Trip snapshot</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {trip_context.property_name ? (
                  <div className="col-span-2">
                    <span className="font-medium text-airbnb-charcoal">Property:</span> {trip_context.property_name}
                  </div>
                ) : null}
                {trip_context.destination ? (
                  <div>
                    <span className="font-medium text-airbnb-charcoal">Destination:</span> {trip_context.destination}
                  </div>
                ) : null}
                {trip_context.dates ? (
                  <div>
                    <span className="font-medium text-airbnb-charcoal">Dates:</span> {trip_context.dates}
                  </div>
                ) : null}
                {trip_context.party ? (
                  <div>
                    <span className="font-medium text-airbnb-charcoal">Party:</span> {trip_context.party}
                  </div>
                ) : null}
                {trip_context.budget ? (
                  <div>
                    <span className="font-medium text-airbnb-charcoal">Budget:</span> {trip_context.budget}
                  </div>
                ) : null}
              </div>
              {trip_context.interests?.length ? (
                <div className="flex flex-wrap gap-1 mt-2">
                  <span className="text-xs font-medium text-airbnb-charcoal">Interests:</span>
                  {trip_context.interests.map((interest) => (
                    <span
                      key={interest}
                      className="rounded-full bg-airbnb-primary/10 px-2 py-1 text-[11px] font-medium text-airbnb-primary"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              ) : null}
              {trip_context.dietary_restrictions?.length ? (
                <div className="flex flex-wrap gap-1 mt-2">
                  <span className="text-xs font-medium text-airbnb-charcoal">Dietary:</span>
                  {trip_context.dietary_restrictions.map((dietary) => (
                    <span
                      key={dietary}
                      className="rounded-full bg-airbnb-secondary/10 px-2 py-1 text-[11px] font-medium text-airbnb-secondary"
                    >
                      {dietary}
                    </span>
                  ))}
                </div>
              ) : null}
              {trip_context.mobility_needs?.length ? (
                <div className="flex flex-wrap gap-1 mt-2">
                  <span className="text-xs font-medium text-airbnb-charcoal">Mobility:</span>
                  {trip_context.mobility_needs.map((mobility) => (
                    <span
                      key={mobility}
                      className="rounded-full bg-base-200 px-2 py-1 text-[11px] font-medium text-airbnb-charcoal/80"
                    >
                      {mobility}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {data_sources?.length ? (
            <div className="mt-3">
              <p className="text-[11px] uppercase tracking-[0.2em] text-airbnb-charcoal/40">Data sources</p>
              <ul className="mt-1 space-y-1 text-[11px] text-airbnb-charcoal/60">
                {data_sources.map((source, index) => {
                  const isUrl = source.reference?.startsWith('http');
                  return (
                    <li key={index} className="break-words">
                      <span className="font-medium">{source.source}</span>
                      {source.reference ? (
                        isUrl ? (
                          <>
                            {' · '}
                            <a
                              href={source.reference}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-airbnb-primary hover:underline"
                            >
                              {new URL(source.reference).hostname}
                            </a>
                          </>
                        ) : (
                          <span> · {source.reference}</span>
                        )
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </div>
      </section>
    );
  }, [response.insights, response.showInsights, response.show_insights]);

  const detailSections = useMemo(
    () => [itinerarySection, restaurantsSection, packingSection, insightsSection].filter(Boolean),
    [itinerarySection, restaurantsSection, packingSection, insightsSection]
  );

  const answerText = response.answer ?? response.summary ?? null;

  // Extract data from insights for prominent display
  const properties = response.insights?.properties ?? [];
  const pois = response.insights?.pois ?? [];
  const webResults = response.insights?.web_results ?? [];
  const eventHighlights = response.insights?.event_highlights ?? [];
  const weatherSummary = response.insights?.weather_summary ?? null;

  return (
    <div className="space-y-4">
      {answerText ? (
        <div className="rounded-3xl border border-base-200 bg-base-100/80 p-4 text-sm text-airbnb-charcoal">
          <p className="whitespace-pre-line leading-relaxed">{answerText}</p>
        </div>
      ) : null}

      {/* Weather Summary - Prominent Display */}
      {weatherSummary && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50/50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-900/60 mb-2">
                Weather Outlook
              </h3>
              <p className="text-sm leading-relaxed text-amber-900/80">{weatherSummary}</p>
            </div>
          </div>
        </div>
      )}

      {/* Web Search Results Section - Prominent Display */}
      {webResults?.length > 0 ? (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-airbnb-charcoal/60">
            Recommended Resources
          </h3>
          <div className="grid gap-3">
            {webResults.slice(0, 6).map((result, index) => (
              <a
                key={index}
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-3xl border border-base-200 bg-base-100 p-4 shadow-sm hover:shadow-md hover:border-airbnb-primary/30 transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-airbnb-primary group-hover:underline line-clamp-1">
                      {result.title || new URL(result.url).hostname}
                    </h4>
                    {result.content && (
                      <p className="mt-2 text-sm leading-relaxed text-airbnb-charcoal/70 line-clamp-3">
                        {result.content}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-airbnb-charcoal/40 truncate">
                      {new URL(result.url).hostname}
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>
      ) : null}

      {/* Available Properties Section - Prominent Display */}
      {properties?.length > 0 ? (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-airbnb-charcoal/60">
            Available Properties
          </h3>
          <div className="grid gap-3">
            {properties.slice(0, 10).map((property, index) => (
              <div key={property.id || index} className="rounded-3xl border border-base-200 bg-base-100 p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h4 className="text-base font-semibold text-airbnb-charcoal">{property.title}</h4>
                    <div className="mt-2 flex flex-wrap gap-2 text-sm text-airbnb-charcoal/70">
                      {property.city && (
                        <span className="flex items-center gap-1">
                          <span>{property.city}{property.state ? `, ${property.state}` : ''}</span>
                        </span>
                      )}
                      {property.propertyType && (
                        <span className="rounded-full bg-airbnb-primary/10 px-3 py-1 text-xs font-medium text-airbnb-primary capitalize">
                          {property.propertyType}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-sm text-airbnb-charcoal/70">
                      {property.bedrooms && <span>{property.bedrooms} bed{property.bedrooms > 1 ? 's' : ''}</span>}
                      {property.bathrooms && <span>{property.bathrooms} bath{property.bathrooms > 1 ? 's' : ''}</span>}
                      {property.maxGuests && <span>Max {property.maxGuests} guest{property.maxGuests > 1 ? 's' : ''}</span>}
                    </div>
                    {property.description && (
                      <p className="mt-3 text-sm leading-relaxed text-airbnb-charcoal/60 line-clamp-2">
                        {property.description}
                      </p>
                    )}
                  </div>
                  {property.pricePerNight && (
                    <div className="flex flex-col items-end">
                      <span className="text-lg font-bold text-airbnb-primary">${property.pricePerNight}</span>
                      <span className="text-xs text-airbnb-charcoal/60">per night</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Points of Interest Section - Prominent Display */}
      {pois?.length > 0 ? (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-airbnb-charcoal/60">
            Nearby Points of Interest
          </h3>
          <div className="grid gap-3">
            {pois.slice(0, 8).map((poi, index) => (
              <div key={poi.id || index} className="rounded-3xl border border-base-200 bg-base-100 p-4 shadow-sm hover:shadow-md transition-shadow">
                <h4 className="text-base font-semibold text-airbnb-charcoal">{poi.title}</h4>
                <div className="mt-2 flex flex-wrap gap-2 text-sm text-airbnb-charcoal/70">
                  {poi.location && (
                    <span className="flex items-center gap-1">
                      <span className="line-clamp-1">{poi.location}</span>
                    </span>
                  )}
                </div>
                {poi.tags && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {poi.tags.split(',').slice(0, 5).map((tag, idx) => (
                      <span
                        key={idx}
                        className="rounded-full bg-airbnb-secondary/10 px-2 py-1 text-xs font-medium text-airbnb-secondary"
                      >
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                )}
                {poi.description && (
                  <p className="mt-3 text-sm leading-relaxed text-airbnb-charcoal/60 line-clamp-2">
                    {poi.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Event Highlights Section - Prominent Display */}
      {eventHighlights?.length > 0 ? (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-airbnb-charcoal/60">
            Event Highlights
          </h3>
          <div className="rounded-3xl border border-base-200 bg-base-100 p-4">
            <ul className="space-y-2">
              {eventHighlights.map((highlight, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-airbnb-charcoal/80">
                  <span className="text-airbnb-primary mt-0.5">•</span>
                  <span className="flex-1">{highlight}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {detailSections.length ? (
        <details className="rounded-3xl border border-base-200 bg-base-50">
          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-airbnb-charcoal">
            Additional details
          </summary>
          <div className="space-y-6 border-t border-base-200 px-4 py-4">
            {detailSections.map((section, index) => (
              <div key={index}>{section}</div>
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}

function ConciergePanelContent({
  isOpen,
  onClose,
  messages,
  isLoading,
  onSubmit,
  onPromptSelect,
  formState,
  onFieldChange,
  onReset,
  conciergeContext,
  dashboardData,
  showExamples,
}) {
  const messageEndRef = useRef(null);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const quickDetails = useMemo(() => {
    if (conciergeContext?.propertyTitle) {
      return `Planning around ${conciergeContext.propertyTitle} in ${conciergeContext.city ?? ''} ${
        conciergeContext.country ?? ''
      }`;
    }
    if (dashboardData?.upcomingBookings?.length) {
      const stay = dashboardData.upcomingBookings[0];
      return `Next stay: ${stay.property.title} (${new Date(stay.startDate).toLocaleDateString()} → ${new Date(
        stay.endDate
      ).toLocaleDateString()})`;
    }
    return 'Share your travel plans and we will tailor the experience.';
  }, [conciergeContext, dashboardData]);

  return createPortal(
    <div
      className={`fixed inset-0 z-50 transition ${
        isOpen ? 'pointer-events-auto' : 'pointer-events-none invisible'
      }`}
      aria-hidden={!isOpen}
    >
      <div
        className={`absolute inset-0 bg-black/30 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
        style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
      />
      <div
        className={`absolute bottom-0 left-0 right-0 z-50 flex h-[88vh] max-h-[780px] flex-col rounded-t-3xl bg-base-100 shadow-2xl transition-transform duration-300 md:bottom-auto md:right-0 md:h-screen md:w-[420px] md:max-h-none md:rounded-none md:rounded-l-3xl ${
          isOpen ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-x-full'
        } relative`}
        role="dialog"
        aria-modal="true"
        style={{ pointerEvents: 'auto' }}
      >
        <header className="flex items-start justify-between border-b border-base-200 px-6 py-5">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-airbnb-charcoal">AI Concierge</p>
            <p className="text-xs text-airbnb-charcoal/60">{quickDetails}</p>
          </div>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-base-200 text-airbnb-charcoal transition hover:bg-base-300"
            onClick={onClose}
            aria-label="Close concierge panel"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="concierge-scroll flex-1 overflow-y-auto">
          <div className="px-6 py-5">
            {messages.length === 0 && isLoading ? (
              <div className="flex min-h-[200px] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="loading-ellipsis text-airbnb-primary" style={{ fontSize: '1.5rem' }}>
                    <span className="dot"></span>
                    <span className="dot"></span>
                    <span className="dot"></span>
                  </div>
                  <span className="text-sm font-semibold text-airbnb-charcoal/70">Asking the concierge</span>
                </div>
              </div>
            ) : messages.length === 0 && !isLoading ? (
              <div className="flex min-h-[200px] items-center justify-center">
                <div className="text-center">
                  <p className="text-sm text-airbnb-charcoal/50">Ask me anything about your trip!</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => {
                  if (message.role === 'user') {
                    return (
                      <div key={message.id} className="flex justify-end">
                        <div className="max-w-[80%] rounded-3xl bg-airbnb-primary text-sm text-white shadow-xl">
                          <p className="px-4 py-3 whitespace-pre-line">{message.query}</p>
                        </div>
                      </div>
                    );
                  }
                  if (message.role === 'assistant' && message.error) {
                    return (
                      <div key={message.id} className="flex justify-start">
                        <div className="max-w-[85%] rounded-3xl border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
                          <p>{message.error}</p>
                          {message.correlationId ? (
                            <p className="mt-1 text-[11px] uppercase tracking-[0.2em]">
                              Ref: {message.correlationId}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    );
                  }
                  if (message.role === 'assistant' && message.response) {
                    return (
                      <div key={message.id} className="flex justify-start">
                        <div className="max-w-[85%] rounded-3xl bg-base-200/60 px-4 py-4 text-sm text-airbnb-charcoal shadow-inner">
                          <ConciergeResponseView response={message.response} />
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}
                {isLoading && messages.length > 0 ? (
                  <div className="flex justify-start">
                    <div className="rounded-3xl bg-base-200/60 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="loading-ellipsis text-airbnb-primary">
                          <span className="dot"></span>
                          <span className="dot"></span>
                          <span className="dot"></span>
                        </div>
                        <span className="text-sm text-airbnb-charcoal/70">AI is thinking</span>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <div className="border-t border-base-200 px-6 py-5 space-y-4">
          {showExamples ? (
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="rounded-full border border-base-300 px-3 py-1 text-xs text-airbnb-charcoal/70 transition hover:border-airbnb-primary hover:text-airbnb-primary"
                  onClick={() => onPromptSelect(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          ) : null}

          <details className="rounded-2xl border border-base-200 bg-base-100">
            <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-airbnb-charcoal">
              Trip details
            </summary>
            <div className="grid gap-3 border-t border-base-200 px-4 py-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-airbnb-charcoal/60">
                    Check-in
                  </label>
                  <input
                    type="date"
                    className="input input-sm mt-1 w-full"
                    value={formState.checkIn}
                    onChange={(event) => onFieldChange('checkIn', event.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-airbnb-charcoal/60">
                    Check-out
                  </label>
                  <input
                    type="date"
                    className="input input-sm mt-1 w-full"
                    value={formState.checkOut}
                    onChange={(event) => onFieldChange('checkOut', event.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-airbnb-charcoal/60">
                    City
                  </label>
                  <input
                    type="text"
                    className="input input-sm mt-1 w-full"
                    value={formState.city}
                    onChange={(event) => onFieldChange('city', event.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-airbnb-charcoal/60">
                    Country
                  </label>
                  <input
                    type="text"
                    className="input input-sm mt-1 w-full"
                    value={formState.country}
                    onChange={(event) => onFieldChange('country', event.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-airbnb-charcoal/60">
                    Party
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2 adults, 1 child"
                    className="input input-sm mt-1 w-full"
                    value={formState.party}
                    onChange={(event) => onFieldChange('party', event.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-airbnb-charcoal/60">
                    Property type
                  </label>
                  <input
                    type="text"
                    placeholder="Apartment, villa, etc."
                    className="input input-sm mt-1 w-full"
                    value={formState.propertyType}
                    onChange={(event) => onFieldChange('propertyType', event.target.value)}
                  />
                </div>
              </div>
            </div>
          </details>

          <details className="rounded-2xl border border-base-200 bg-base-100">
            <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-airbnb-charcoal">
              Preferences
            </summary>
            <div className="grid gap-3 border-t border-base-200 px-4 py-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-airbnb-charcoal/60">
                    Budget
                  </label>
                  <input
                    type="text"
                    placeholder="Value, mid, premium..."
                    className="input input-sm mt-1 w-full"
                    value={formState.budget}
                    onChange={(event) => onFieldChange('budget', event.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-airbnb-charcoal/60">
                    Locale
                  </label>
                  <input
                    type="text"
                    placeholder="en-US, fr-FR..."
                    className="input input-sm mt-1 w-full"
                    value={formState.locale}
                    onChange={(event) => onFieldChange('locale', event.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-airbnb-charcoal/60">
                  Interests (comma separated)
                </label>
                <input
                  type="text"
                  className="input input-sm mt-1 w-full"
                  value={formState.interests}
                  onChange={(event) => onFieldChange('interests', event.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-airbnb-charcoal/60">
                    Dietary needs
                  </label>
                  <input
                    type="text"
                    placeholder="Vegan, gluten-free..."
                    className="input input-sm mt-1 w-full"
                    value={formState.dietary}
                    onChange={(event) => onFieldChange('dietary', event.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-airbnb-charcoal/60">
                    Mobility
                  </label>
                  <input
                    type="text"
                    placeholder="Wheelchair, minimal stairs..."
                    className="input input-sm mt-1 w-full"
                    value={formState.mobility}
                    onChange={(event) => onFieldChange('mobility', event.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-airbnb-charcoal/60">
                  Traveler persona
                </label>
                <input
                  type="text"
                  placeholder="Digital nomad, adventure seeker..."
                  className="input input-sm mt-1 w-full"
                  value={formState.persona}
                  onChange={(event) => onFieldChange('persona', event.target.value)}
                />
              </div>
            </div>
          </details>

          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-airbnb-charcoal/60">
              Ask the concierge
            </label>
            <textarea
              className="textarea mt-2 h-24 w-full resize-none text-sm"
              placeholder="Tell us what kind of experience you want to create..."
              value={formState.query}
              onChange={(event) => onFieldChange('query', event.target.value)}
            />
          </div>
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              className="btn btn-ghost btn-sm rounded-full"
              onClick={onReset}
              disabled={isLoading}
            >
              Reset
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm rounded-full text-white"
              onClick={onSubmit}
              disabled={isLoading || !formState.query.trim()}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="loading loading-spinner loading-sm text-white" />
                  <span>Planning…</span>
                </span>
              ) : (
                'Ask concierge'
              )}
            </button>
          </div>
          <div ref={messageEndRef} />
        </div>
      </div>
      </div>
    </div>,
    document.body
  );
}

export default function ConciergePanel({ isOpen, onClose, onBusyChange = () => {} }) {
  const { context: conciergeContext } = useConciergeContext();
  const [formState, setFormState] = useState(initialFormState);
  const [hasEdited, setHasEdited] = useState(false);
  const [messages, setMessages] = useState([]);
  const [showExamples, setShowExamples] = useState(true);
  const conciergeMutation = useConciergeAgent();

  const { data: dashboardData } = useTravelerDashboard({ enabled: isOpen });

  const applyDefaults = useCallback(
    (source) => {
      if (!source) return;
      setFormState((prev) => ({
        ...prev,
        checkIn: source.checkIn ?? prev.checkIn,
        checkOut: source.checkOut ?? prev.checkOut,
        city: source.city ?? prev.city,
        country: source.country ?? prev.country,
        party: source.party ?? prev.party,
        propertyType: source.propertyType ?? prev.propertyType,
        query: prev.query || source.query || '',
      }));
    },
    []
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    if (!hasEdited && conciergeContext) {
      applyDefaults({
        checkIn: conciergeContext.checkIn ?? '',
        checkOut: conciergeContext.checkOut ?? '',
        city: conciergeContext.city ?? '',
        country: conciergeContext.country ?? '',
        party: conciergeContext.party ?? '',
        propertyType: conciergeContext.propertyType ?? '',
      });
    } else if (!hasEdited && dashboardData?.upcomingBookings?.length) {
      const stay = dashboardData.upcomingBookings[0];
      applyDefaults({
        checkIn: stay.startDate ? stay.startDate.slice(0, 10) : '',
        checkOut: stay.endDate ? stay.endDate.slice(0, 10) : '',
        city: stay.property?.city ?? '',
        country: stay.property?.country ?? '',
        party: stay.guests ? `${stay.guests} guests` : '',
        propertyType: stay.property?.propertyType ?? '',
      });
    }
  }, [isOpen, conciergeContext, dashboardData, hasEdited, applyDefaults]);

  useEffect(() => {
    if (!isOpen) {
      setHasEdited(false);
      if (messages.length === 0) {
        setShowExamples(true);
      }
    }
  }, [isOpen, messages.length]);

  const handleFieldChange = useCallback((field, value) => {
    setHasEdited(true);
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handlePromptSelect = useCallback(
    (prompt) => {
      setHasEdited(true);
      setShowExamples(false);
      setFormState((prev) => ({
        ...prev,
        query: prompt,
      }));
    },
    []
  );

  const handleReset = useCallback(() => {
    setHasEdited(false);
    setShowExamples(true);
    setFormState({ ...initialFormState });
  }, []);

  const handleSubmit = useCallback(() => {
    setShowExamples(false);
    
    // Validate required fields
    if (!formState.query.trim()) {
      return;
    }
    
    // Use default values if trip details are missing
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    
    const payload = {
      booking: {
        check_in: formState.checkIn || today,
        check_out: formState.checkOut || tomorrow,
        city: formState.city || undefined,
        country: formState.country || undefined,
        party: formState.party || undefined,
        property_type: formState.propertyType || undefined,
      },
      query: formState.query.trim(),
      locale: formState.locale || undefined,
    };

    const preferences = {
      budget: formState.budget || undefined,
      interests: parseList(formState.interests),
      mobility_needs: parseList(formState.mobility),
      dietary_restrictions: parseList(formState.dietary),
      traveler_persona: formState.persona || undefined,
    };

    if (
      !preferences.budget &&
      !preferences.traveler_persona &&
      preferences.interests.length === 0 &&
      preferences.mobility_needs.length === 0 &&
      preferences.dietary_restrictions.length === 0
    ) {
      delete payload.preferences;
    } else {
      payload.preferences = preferences;
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      query: formState.query.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);

    conciergeMutation.mutate(payload, {
      onSuccess: (response) => {
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            response,
          },
        ]);
      },
      onError: (error) => {
        const rawDetail = error.response?.data?.detail ?? error.response?.data?.message;
        let readableMessage = error.message ?? 'Something went wrong while planning your trip.';
        if (typeof rawDetail === 'string') {
          readableMessage = rawDetail;
        } else if (rawDetail?.message && typeof rawDetail.message === 'string') {
          readableMessage = rawDetail.message;
        } else if (rawDetail) {
          try {
            readableMessage = JSON.stringify(rawDetail);
          } catch {
            readableMessage = String(rawDetail);
          }
        }

        const correlationId =
          (typeof rawDetail === 'object' && rawDetail?.correlation_id) ||
          error.response?.data?.correlationId ||
          error.response?.headers?.['x-request-id'];

        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            error: readableMessage,
            correlationId,
          },
        ]);
      },
    });

    setFormState((prev) => ({
      ...prev,
      query: '',
    }));
  }, [formState, conciergeMutation]);

  useEffect(() => {
    onBusyChange(conciergeMutation.isPending);
  }, [conciergeMutation.isPending, onBusyChange]);

  return (
    <ConciergePanelContent
      isOpen={isOpen}
      onClose={onClose}
      messages={messages}
      isLoading={conciergeMutation.isPending}
      onSubmit={handleSubmit}
      onPromptSelect={handlePromptSelect}
      formState={formState}
      onFieldChange={handleFieldChange}
      onReset={handleReset}
      conciergeContext={conciergeContext}
      dashboardData={dashboardData}
      showExamples={showExamples && messages.length === 0}
    />
  );
}
