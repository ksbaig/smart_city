# GitHub Copilot Implementation Prompt
## Local Voice Search + Semantic RAG over GeoJSON in Angular 17

### Objective

Implement a voice-enabled natural-language search feature in my existing Angular 17 GIS application. The application already loads a local ATM GeoJSON file and supports exact search by ATM ID and Branch ID. Preserve the existing functionality and integrate the new feature into the current project rather than rebuilding the application.

The GeoJSON resources are stored in the existing `public/RAG/` folder. Inspect that folder and identify the actual GeoJSON filenames and schema before making changes. Do not assume the filename, property casing, or field names.

Example user request:

> “Show all ATMs in Al Malaz district.”

Expected behavior:

1. The user clicks a microphone button and speaks a request.
2. Browser speech recognition converts speech into text.
3. The recognized text is displayed in the search box.
4. A natural-language query service interprets the request.
5. The application retrieves matching records from local GeoJSON resources in `public/RAG/`.
6. Matching ATM records appear on the existing GIS map, and the results table/count are updated.

Do not use ElevenLabs, n8n, or another external voice-agent platform for this implementation.

---

## 1. Inspect the Existing Project First

Before coding:

- Inspect the Angular 17 project structure, routes, components, services, and package versions.
- Find the existing ATM/branch search implementation.
- Inspect `public/RAG/` and list its GeoJSON resources.
- Inspect the GeoJSON `FeatureCollection`, geometry types, coordinate reference expectations, and actual `properties` fields.
- Identify the existing map library and map/layer initialization. Prefer reusing the current ArcGIS Maps SDK (`@arcgis/core`) implementation if that is what the project uses.
- Identify the exact ATM ID, Branch ID, district, category/coverage, and other relevant fields from the data.
- Report the findings briefly before changing files.

Do not replace working components, layers, basemaps, popups, or search behavior without a clear need.

## 2. Load Local GeoJSON from `public/RAG/`

In standard Angular CLI projects, files in `public/` are typically served from the application root. Verify the project's Angular configuration and asset setup. If the files are copied to the build output as expected, load them using a URL such as:

`/RAG/<actual-file-name>.geojson`

Do not use a source-code filesystem path in browser code.

Requirements:

- Load the GeoJSON with `HttpClient` or `fetch`, following the project's existing conventions.
- Load and cache the data once, rather than fetching it for every search.
- Support one or multiple GeoJSON files if the folder contains several relevant resources.
- Validate responses and handle missing files, invalid JSON, unsupported geometry, and missing attributes gracefully.
- Keep the local GeoJSON as the authoritative source for the map's ATM records.
- Do not copy the dataset into a second hardcoded array.
- Do not fabricate records, coordinates, district names, or counts.

If the existing Angular configuration does not serve `public/RAG/` as expected, explain the required asset configuration and implement the smallest correct change.

## 3. Add Browser Voice Input (No ElevenLabs)

Create or update a reusable service such as `voice-search.service.ts`.

Use the browser Web Speech API where supported:

- Check for `window.SpeechRecognition` and `window.webkitSpeechRecognition`.
- Request microphone access only after the user clicks the microphone button.
- Set the recognition language to `en-US` initially, but keep it configurable for future language support.
- Show clear states such as Idle, Listening, Processing, and Error.
- Put the recognized transcript into the existing search input and pass it to the same search pipeline used for typed queries.
- Provide Start and Stop controls.
- Handle unsupported browsers, permission denial, no speech, recognition errors, and cancellation.
- Clean up recognition handlers on component destruction.
- Do not claim speech recognition is fully offline: browser implementations vary, and some may use a remote recognition service.
- Do not add an external speech service or send microphone audio to a server.
- If the Web Speech API is unsupported, leave typed search fully usable and show a helpful message.

Do not make microphone recording start automatically. It must be initiated by the user.

## 4. Build a Natural-Language Query Service

Create or update a service such as `natural-language-query.service.ts`.

It should convert a recognized or typed question into a structured query object, for example:

```ts
interface AtmQuery {
  intent:
    | 'filter'
    | 'count'
    | 'find-atm-id'
    | 'find-branch-id'
    | 'compare-districts'
    | 'show-all'
    | 'unknown';
  districtNames?: string[];
  atmId?: string;
  branchId?: string;
  category?: string;
  originalQuestion: string;
}
```

Support example queries:

- “Show all ATMs in Al Malaz.”
- “How many ATMs are in Al Malaz?”
- “Find ATM ID 10829.”
- “Find Branch ID 5001.”
- “Compare ATMs in Al Malaz and Al Olaya.”
- “Show all ATMs.”
- “Show ATMs with strong coverage in Al Malaz.”

Requirements:

- Preserve and reuse the current exact ATM ID and Branch ID search behavior.
- Detect numeric IDs carefully and distinguish ATM IDs from Branch IDs using context.
- Derive district names from actual GeoJSON values rather than assuming a fixed list.
- Support a configurable alias dictionary for spelling variations, for example `Almulaz`, `Al Malaz`, and `Al-Malaz`, mapping them to the actual district value in the data only after confirming the correct canonical value.
- Normalize case, whitespace, hyphens, punctuation, and Unicode consistently.
- Do not silently treat a misspelled or ambiguous district as a valid district. If no reliable match exists, show a clarification or no-match message.
- Keep query interpretation separate from GeoJSON retrieval and map rendering.

Start with deterministic natural-language parsing for structured filters. Do not claim that keyword matching alone is a full semantic AI/RAG model.

## 5. Implement Local Retrieval and Filtering

Create or update `atm-data.service.ts`.

The service must:

- Query the cached GeoJSON features using the parsed `AtmQuery`.
- Filter using the actual field names found during inspection.
- Support exact ATM ID and Branch ID searches.
- Support district filters, multiple-district comparisons, category/coverage filters, count queries, and show-all.
- Return structured results such as:

```ts
interface AtmQueryResponse {
  intent: string;
  matchedFeatures: GeoJSON.Feature[];
  count: number;
  appliedFilters: Record<string, unknown>;
  message: string;
}
```

- Use exact attribute filtering for requirements such as “all ATMs in Al Malaz.” Do not rely on vector similarity alone for exhaustive district results.
- Ensure counts and results are calculated from the actual data.
- Handle zero results and missing fields without crashing.
- If multiple GeoJSON files have overlapping features, avoid accidental duplicate results where appropriate, using a verified stable identifier.

## 6. Semantic Retrieval / RAG Design

Implement the first version without requiring a Python backend, vector database, external LLM, or paid AI API.

Use a layered design:

1. **Voice-to-text:** browser Web Speech API.
2. **Query interpretation:** TypeScript service parses the text into a structured intent and filters.
3. **Retrieval:** local GeoJSON data service returns matching records.
4. **Grounded response:** build a simple response from the actual matching records, such as “12 ATMs found in Al Malaz.”
5. **Map visualization:** update the existing GIS map with those exact features.

Important distinction: deterministic filtering and templated answers provide a useful local natural-language search experience, but they are not by themselves full embedding-based RAG.

Keep the code modular so that optional semantic retrieval can be added later. If a future phase adds embeddings:

- Use a JavaScript-compatible embedding model or a separately configured service.
- Document model download size, browser memory/performance, and whether data leaves the device.
- Use semantic similarity to retrieve descriptive records where appropriate.
- Combine semantic retrieval with exact structured filters.
- Never use embeddings alone to guarantee that every record in a district is returned.
- Only add vector indexing or an LLM if there is a demonstrated requirement; do not install unnecessary dependencies now.

## 7. Update the Existing GIS Map

Create or update a map integration service/component without rebuilding the existing map.

When a query returns matching features:

- Show only the matching ATM features in the results overlay/layer, or apply a definition/filter expression if supported by the existing layer and data setup.
- Keep the original source data intact.
- Zoom to the extent of matching geometries.
- Handle a single point with an appropriate scale.
- Show existing ATM popup fields when a user clicks a result.
- Clear the active filter when “show all ATMs” is requested.
- Keep the map, results table, summary, and count synchronized.
- Do not zoom to an invalid or empty extent when there are no results.
- Preserve existing map controls, basemaps, layers, popups, and other functionality.

If the current map uses ArcGIS Maps SDK for JavaScript (`@arcgis/core`), use its existing map and view objects. Do not create a second independent map.

## 8. UI Requirements

Add a natural-language search input and microphone button to the existing search UI.

Example placeholder:

`Ask about ATMs, e.g. “Show all ATMs in Al Malaz”`

Show:

- The recognized transcript.
- A listening/processing indicator.
- A clear error or clarification message when needed.
- The number of matching records.
- The results table using actual GeoJSON fields.
- Map markers for matching records.

Keep the existing ATM ID and Branch ID search available. A user should be able to type or speak; both inputs must call the same query pipeline.

## 9. Testing and Acceptance Criteria

Test all of these using the actual local GeoJSON:

1. Type “Show all ATMs in Al Malaz.”
2. Speak “Show all ATMs in Al Malaz.”
3. Verify both produce the same matching records.
4. Search ATM ID `10829`.
5. Search a valid Branch ID that exists in the data.
6. Ask “How many ATMs are in Al Malaz?” and verify the count against the actual filtered records.
7. Compare two valid districts.
8. Ask for all ATMs and verify the filter is cleared.
9. Test a district spelling variation supported by the alias configuration.
10. Test an unknown district and verify a helpful no-match/clarification response.
11. Test browser speech recognition unsupported, denied, and failed cases.
12. Verify map markers, table rows, popups, and count all refer to the same result set.
13. Verify the GeoJSON loads successfully from `public/RAG/` after a production build.

Do not invent expected district counts. Derive them from the loaded file.

## 10. Security, Quality, and Deliverables

- No ElevenLabs, n8n, or voice-agent dependency.
- No API keys or secrets in frontend code.
- No backend required for the initial version.
- Avoid unnecessary new packages.
- Use Angular 17-compatible APIs and the project's installed versions.
- Keep TypeScript types clear and avoid `any` except where needed to bridge browser speech-recognition typings.
- Add helpful error handling and comments.
- Do not break the existing application.

When complete, provide:

1. A list of files created or changed.
2. The actual GeoJSON filename(s) found in `public/RAG/`.
3. The real property names used for ATM ID, Branch ID, district, and coverage/category.
4. Any configuration or dependency changes.
5. Instructions to run and test the feature.
6. Any known limitations of browser speech recognition.
7. A clear note distinguishing the implemented local retrieval/filtering from any optional future embedding-based RAG.

**Start by inspecting the existing project and the `public/RAG/` folder. Then implement the feature incrementally, preserving all current search and GIS behavior.**
