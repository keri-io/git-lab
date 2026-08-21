import { HttpError } from "fresh";
import { Head } from "fresh/runtime";
import { define } from "../utils.ts";

export default define.page(function ErrorPage(ctx) {
  const error = ctx.error;
  const is404 = error instanceof HttpError && error.status === 404;
  const title = is404 ? "Not found" : "Error";
  const heading = is404 ? "Lesson not found" : "Something went wrong";
  const detail = is404
    ? "That lesson is not in the catalog."
    : "The page failed to load.";

  return (
    <div class="min-h-screen bg-[var(--lg-bg)] text-[var(--lg-text)]">
      <Head>
        <title>{title} · Git Lab</title>
      </Head>
      <div class="max-w-2xl mx-auto px-4 py-12">
        <h1 class="text-4xl font-semibold mb-3">{heading}</h1>
        <p class="text-[var(--lg-muted)] mb-8 leading-relaxed">{detail}</p>
        <a href="/" class="lg-link underline">Back to catalog</a>
      </div>
    </div>
  );
});
