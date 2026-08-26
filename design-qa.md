# Design QA

## Comparison target

- Source visual truth: `/Users/nathan22177/.codex/generated_images/01a03d38-b6ad-7e91-afdf-bb81775f5564/exec-34e65aa2-b80d-4872-a782-34e21344324c.png`
- Source pixels: `1487 × 1058`
- Intended CSS viewport: `1440 × 1024`, density `1`
- State: dark theme, all observed source and destination chains selected, default slider values
- Implementation URL: local static site served from the repository root
- Initial implementation screenshot: `/var/folders/sj/n_m4zd294_gfgl2082bmygb00000gn/T/codex-clipboard-726d74fa-ce60-47ca-9c13-3c82b1453cff.png`
- Initial implementation pixels: `4098 × 2366`; this is a wider viewport than the source mock, so proportions were evaluated without claiming pixel-level equivalence
- Revised implementation screenshot: unavailable because browser access to the local `file:` URL is blocked

## Full-view comparison evidence

The source visual and the user-provided initial implementation screenshot were both opened and inspected. They show the same default interaction state, but different viewport aspect ratios. The initial implementation preserved the selected two-column structure, but the vertical control stack extended below the primary visualization and the typography appeared materially heavier than the source.

## Focused region comparison evidence

The header, chain selectors, metric cards, slider controls, and Sankey labels were legible in the initial screenshot. A post-fix focused comparison is blocked because the revised implementation cannot be captured in the approved browser.

## Findings

- [P1] Post-fix browser-rendered evidence is missing.
  - Location: full desktop and mobile page.
  - Evidence: the initial user screenshot is available, but the approved browser blocks the revised local `file:` URL.
  - Impact: the slider relocation, font loading, responsive stacking, and final overflow behavior cannot be signed off.
  - Fix: capture the refreshed implementation at desktop and mobile widths.

## Static verification completed

- JavaScript syntax check passed.
- HTML, CSS, JavaScript, and all eleven local SVG assets return HTTP 200 from the local server.
- Every SVG passes XML validation.
- Git whitespace validation passed.

## Comparison history

- Initial pass findings: controls extended below the main numerical results and primary visualization; headings, metrics, and Sankey labels appeared too heavy; header destinations did not match the requested conversion path.
- Fixes made: moved all three sliders above the metric cards; added Inter for UI and Manrope for headings/numerals with lighter optical weights; reduced Sankey label weight; linked the logo to `https://app.ston.fi/`; linked the primary button to the official “How to Become a Resolver” guide.
- Post-fix evidence: unavailable because browser capture of the local file is blocked.
- Manual review: the user inspected the refreshed local page and explicitly approved it for commit on 2026-08-26. This does not replace the missing automated screenshot evidence required for a formal Product Design QA pass.

## Final result

final result: blocked
