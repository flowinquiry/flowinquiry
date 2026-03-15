"use client";

const TruncatedHtmlLabel = ({
  htmlContent,
  wordLimit,
}: {
  htmlContent: string;
  wordLimit: number;
}) => {
  const isTruncated = htmlContent.length > wordLimit;

  const content = isTruncated
    ? htmlContent.substring(0, wordLimit) + " ..."
    : htmlContent;

  // Strip all HTML tags to get plain text for the title tooltip
  const plainText = isTruncated
    ? htmlContent
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    : undefined;

  return (
    <div dangerouslySetInnerHTML={{ __html: content }} title={plainText} />
  );
};

export default TruncatedHtmlLabel;
