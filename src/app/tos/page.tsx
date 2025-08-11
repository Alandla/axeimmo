import { Button } from "@/src/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useTranslations } from 'next-intl';

const TOS = () => {
  const t = useTranslations('tos');

  const renderContent = (content: string) => {
    return content.split('\n').map((line, index) => {
      if (line.trim() === '') {
        return <br key={index} />;
      }
      
      // Handle bullet points
      if (line.trim().startsWith('- ')) {
        const bulletContent = line.trim().substring(2);
        return (
          <div key={index} className="ml-4 mb-1">
            • {renderInlineFormatting(bulletContent)}
          </div>
        );
      }
      
      return <div key={index} className="mb-2">{renderInlineFormatting(line)}</div>;
    });
  };

  const renderInlineFormatting = (text: string) => {
    // Process text step by step to avoid conflicts
    const processFormatting = (str: string): React.ReactNode[] => {
      const parts: React.ReactNode[] = [];
      let remaining = str;
      let keyIndex = 0;

      // Split by different patterns one at a time
      const boldPattern = /\*\*(.*?)\*\*/;
      const highlightPattern = /==(.*?)==/;
      const quotePattern = /"([^"]+)"/;

      while (remaining.length > 0) {
        // Check for bold
        const boldMatch = remaining.match(boldPattern);
        const highlightMatch = remaining.match(highlightPattern);
        const quoteMatch = remaining.match(quotePattern);

        // Find the earliest match
        let earliestMatch = null;
        let earliestIndex = remaining.length;
        let matchType = '';

        if (boldMatch && boldMatch.index !== undefined && boldMatch.index < earliestIndex) {
          earliestMatch = boldMatch;
          earliestIndex = boldMatch.index;
          matchType = 'bold';
        }
        if (highlightMatch && highlightMatch.index !== undefined && highlightMatch.index < earliestIndex) {
          earliestMatch = highlightMatch;
          earliestIndex = highlightMatch.index;
          matchType = 'highlight';
        }
        if (quoteMatch && quoteMatch.index !== undefined && quoteMatch.index < earliestIndex) {
          earliestMatch = quoteMatch;
          earliestIndex = quoteMatch.index;
          matchType = 'quote';
        }

        if (earliestMatch && earliestMatch.index !== undefined) {
          // Add text before the match
          if (earliestMatch.index > 0) {
            parts.push(remaining.substring(0, earliestMatch.index));
          }

          // Add the formatted element
          switch (matchType) {
            case 'bold':
              parts.push(<strong key={keyIndex++}>{earliestMatch[1]}</strong>);
              break;
            case 'highlight':
              parts.push(<mark key={keyIndex++} className="tos-highlight">{earliestMatch[1]}</mark>);
              break;
            case 'quote':
              parts.push(<span key={keyIndex++} className="font-semibold text-blue-800">« {earliestMatch[1]} »</span>);
              break;
          }

          // Continue with the rest
          remaining = remaining.substring(earliestMatch.index + earliestMatch[0].length);
        } else {
          // No more matches, add the remaining text
          parts.push(remaining);
          break;
        }
      }

      return parts;
    };

    const formattedParts = processFormatting(text);
    return <>{formattedParts}</>;
  };

  return (
    <main className="max-w-4xl mx-auto">
      <div className="p-5">
        <Button variant="link" asChild>
          <Link href="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('back')}
          </Link>
        </Button>
        
        <h1 className="text-3xl font-extrabold pb-6">
          {t('title')}
        </h1>

        <div className="tos-content">
          {/* Main Title */}
          <h2 className="tos-main-title text-2xl font-bold mb-8 text-center">
            {t('main-title')}
          </h2>

          {/* Section 1 */}
          <section className="mb-8">
            <h3 className="tos-section-title text-xl font-semibold mb-4">
              {t('section1.title')}
            </h3>
            <div className="tos-section-content">
              {renderContent(t('section1.content'))}
            </div>
          </section>

          {/* Section 2 */}
          <section className="mb-8">
            <h3 className="tos-section-title text-xl font-semibold mb-4">
              {t('section2.title')}
            </h3>
            <div className="tos-section-content">
              {renderContent(t('section2.content'))}
            </div>
          </section>

          {/* Section 3 - with table */}
          <section className="mb-8">
            <h3 className="tos-section-title text-xl font-semibold mb-4">
              {t('section3.title')}
            </h3>
            <div className="tos-table border border-gray-300 rounded-lg overflow-hidden">
              <div className="tos-table-row border-b border-gray-300">
                <div className="tos-table-header bg-gray-50 p-4 font-semibold border-r border-gray-300 w-1/3">
                  {t('section3.table.function-title')}
                </div>
                <div className="tos-table-cell p-4">
                  {renderContent(t('section3.table.function-content'))}
                </div>
              </div>
              <div className="tos-table-row border-b border-gray-300">
                <div className="tos-table-header bg-gray-50 p-4 font-semibold border-r border-gray-300 w-1/3">
                  {t('section3.table.location-title')}
                </div>
                <div className="tos-table-cell p-4">
                  {renderContent(t('section3.table.location-content'))}
                </div>
              </div>
              <div className="tos-table-row">
                <div className="tos-table-header bg-gray-50 p-4 font-semibold border-r border-gray-300 w-1/3">
                  {t('section3.table.acceptance-title')}
                </div>
                <div className="tos-table-cell p-4">
                  {renderContent(t('section3.table.acceptance-content'))}
                </div>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="mb-8">
            <h3 className="tos-section-title text-xl font-semibold mb-4">
              {t('section4.title')}
            </h3>
            <div className="tos-section-content">
              {renderContent(t('section4.content'))}
            </div>
          </section>

          {/* Section 5 */}
          <section className="mb-8">
            <h3 className="tos-section-title text-xl font-semibold mb-4">
              {t('section5.title')}
            </h3>
            <div className="tos-section-content">
              {renderContent(t('section5.content'))}
            </div>
          </section>

          {/* Section 6 */}
          <section className="mb-8">
            <h3 className="tos-section-title text-xl font-semibold mb-4">
              {t('section6.title')}
            </h3>
            
            {/* Section 6.1 */}
            <div className="mb-6">
              <h4 className="tos-subsection-title text-lg font-medium mb-3 ml-4">
                {t('section6.subsection6_1.title')}
              </h4>
              <div className="tos-section-content ml-4">
                {renderContent(t('section6.subsection6_1.content'))}
              </div>
            </div>

            {/* Section 6.2 */}
            <div className="mb-6">
              <h4 className="tos-subsection-title text-lg font-medium mb-3 ml-4">
                {t('section6.subsection6_2.title')}
              </h4>
              
              {/* Section 6.2.1 - Maintenance */}
              <div className="mb-4 ml-8">
                <h5 className="tos-subsubsection-title text-base font-medium mb-2">
                  {t('section6.subsection6_2.maintenance.title')}
                </h5>
                <div className="tos-section-content">
                  {renderContent(t('section6.subsection6_2.maintenance.content'))}
                </div>
              </div>

              {/* Section 6.2.2 - Hosting */}
              <div className="mb-4 ml-8">
                <h5 className="tos-subsubsection-title text-base font-medium mb-2">
                  {t('section6.subsection6_2.hosting.title')}
                </h5>
                <div className="tos-section-content">
                  {renderContent(t('section6.subsection6_2.hosting.content'))}
                </div>
              </div>

              {/* Section 6.2.3 - Support */}
              <div className="mb-4 ml-8">
                <h5 className="tos-subsubsection-title text-base font-medium mb-2">
                  {t('section6.subsection6_2.support.title')}
                </h5>
                <div className="tos-section-content">
                  {renderContent(t('section6.subsection6_2.support.content'))}
                </div>
              </div>
            </div>
          </section>

          {/* Section 7 */}
          <section className="mb-8">
            <h3 className="tos-section-title text-xl font-semibold mb-4">
              {t('section7.title')}
            </h3>
            <div className="tos-section-content">
              {renderContent(t('section7.content'))}
            </div>
          </section>

          {/* Section 8 */}
          <section className="mb-8">
            <h3 className="tos-section-title text-xl font-semibold mb-4">
              {t('section8.title')}
            </h3>
            
            {/* Section 8.1 */}
            <div className="mb-6">
              <h4 className="tos-subsection-title text-lg font-medium mb-3 ml-4">
                {t('section8.subsection8_1.title')}
              </h4>
              <div className="tos-section-content ml-4">
                {renderContent(t('section8.subsection8_1.content'))}
              </div>
            </div>

            {/* Section 8.2 */}
            <div className="mb-6">
              <h4 className="tos-subsection-title text-lg font-medium mb-3 ml-4">
                {t('section8.subsection8_2.title')}
              </h4>
              <div className="tos-section-content ml-4">
                {renderContent(t('section8.subsection8_2.content'))}
              </div>
            </div>

            {/* Section 8.3 */}
            <div className="mb-6">
              <h4 className="tos-subsection-title text-lg font-medium mb-3 ml-4">
                {t('section8.subsection8_3.title')}
              </h4>
              <div className="tos-section-content ml-4">
                {renderContent(t('section8.subsection8_3.content'))}
              </div>
            </div>
          </section>

          {/* Section 9 */}
          <section className="mb-8">
            <h3 className="tos-section-title text-xl font-semibold mb-4">
              {t('section9.title')}
            </h3>
            <div className="tos-section-content">
              {renderContent(t('section9.content'))}
            </div>
          </section>

          {/* Section 10 */}
          <section className="mb-8">
            <h3 className="tos-section-title text-xl font-semibold mb-4">
              {t('section10.title')}
            </h3>
            <div className="tos-section-content">
              {renderContent(t('section10.content'))}
            </div>
          </section>

          {/* Section 11 */}
          <section className="mb-8">
            <h3 className="tos-section-title text-xl font-semibold mb-4">
              {t('section11.title')}
            </h3>
            
            {/* Section 11.1 */}
            <div className="mb-6">
              <h4 className="tos-subsection-title text-lg font-medium mb-3 ml-4">
                {t('section11.subsection11_1.title')}
              </h4>
              <div className="tos-section-content ml-4">
                {renderContent(t('section11.subsection11_1.content'))}
              </div>
            </div>

            {/* Section 11.2 */}
            <div className="mb-6">
              <h4 className="tos-subsection-title text-lg font-medium mb-3 ml-4">
                {t('section11.subsection11_2.title')}
              </h4>
              <div className="tos-section-content ml-4">
                {renderContent(t('section11.subsection11_2.content'))}
              </div>
            </div>

            {/* Section 11.3 */}
            <div className="mb-6">
              <h4 className="tos-subsection-title text-lg font-medium mb-3 ml-4">
                {t('section11.subsection11_3.title')}
              </h4>
              <div className="tos-section-content ml-4">
                {renderContent(t('section11.subsection11_3.content'))}
              </div>
            </div>

            {/* Section 11.4 */}
            <div className="mb-6">
              <h4 className="tos-subsection-title text-lg font-medium mb-3 ml-4">
                {t('section11.subsection11_4.title')}
              </h4>
              <div className="tos-section-content ml-4">
                {renderContent(t('section11.subsection11_4.content'))}
              </div>
            </div>
          </section>

          {/* Section 12 */}
          <section className="mb-8">
            <h3 className="tos-section-title text-xl font-semibold mb-4">
              {t('section12.title')}
            </h3>
            
            {/* Section 12.1 */}
            <div className="mb-6">
              <h4 className="tos-subsection-title text-lg font-medium mb-3 ml-4">
                {t('section12.subsection12_1.title')}
              </h4>
              <div className="tos-section-content ml-4">
                {renderContent(t('section12.subsection12_1.content'))}
              </div>
            </div>

            {/* Section 12.2 */}
            <div className="mb-6">
              <h4 className="tos-subsection-title text-lg font-medium mb-3 ml-4">
                {t('section12.subsection12_2.title')}
              </h4>
              <div className="tos-section-content ml-4">
                {renderContent(t('section12.subsection12_2.content'))}
              </div>
            </div>

            {/* Section 12.3 */}
            <div className="mb-6">
              <h4 className="tos-subsection-title text-lg font-medium mb-3 ml-4">
                {t('section12.subsection12_3.title')}
              </h4>
              <div className="tos-section-content ml-4">
                {renderContent(t('section12.subsection12_3.content'))}
              </div>
            </div>
          </section>

          {/* Section 13 */}
          <section className="mb-8">
            <h3 className="tos-section-title text-xl font-semibold mb-4">
              {t('section13.title')}
            </h3>
            
            {/* Introduction */}
            <div className="tos-section-content mb-6">
              {renderContent(t('section13.intro'))}
            </div>
            
            {/* Section 13.1 */}
            <div className="mb-6">
              <h4 className="tos-subsection-title text-lg font-medium mb-3 ml-4">
                {t('section13.subsection13_1.title')}
              </h4>
              <div className="tos-section-content ml-4">
                {renderContent(t('section13.subsection13_1.content'))}
              </div>
            </div>

            {/* Section 13.2 */}
            <div className="mb-6">
              <h4 className="tos-subsection-title text-lg font-medium mb-3 ml-4">
                {t('section13.subsection13_2.title')}
              </h4>
              <div className="tos-section-content ml-4">
                {renderContent(t('section13.subsection13_2.content'))}
              </div>
            </div>

            {/* Section 13.3 */}
            <div className="mb-6">
              <h4 className="tos-subsection-title text-lg font-medium mb-3 ml-4">
                {t('section13.subsection13_3.title')}
              </h4>
              <div className="tos-section-content ml-4">
                {renderContent(t('section13.subsection13_3.content'))}
              </div>
            </div>

            {/* Section 13.4 */}
            <div className="mb-6">
              <h4 className="tos-subsection-title text-lg font-medium mb-3 ml-4">
                {t('section13.subsection13_4.title')}
              </h4>
              <div className="tos-section-content ml-4">
                {renderContent(t('section13.subsection13_4.content'))}
              </div>
            </div>

            {/* Section 13.5 */}
            <div className="mb-6">
              <h4 className="tos-subsection-title text-lg font-medium mb-3 ml-4">
                {t('section13.subsection13_5.title')}
              </h4>
              <div className="tos-section-content ml-4">
                {renderContent(t('section13.subsection13_5.content'))}
              </div>
            </div>

            {/* Section 13.6 */}
            <div className="mb-6">
              <h4 className="tos-subsection-title text-lg font-medium mb-3 ml-4">
                {t('section13.subsection13_6.title')}
              </h4>
              <div className="tos-section-content ml-4">
                {renderContent(t('section13.subsection13_6.content'))}
              </div>
            </div>
          </section>

          {/* Section 14 */}
          <section className="mb-8">
            <h3 className="tos-section-title text-xl font-semibold mb-4">
              {t('section14.title')}
            </h3>
            <div className="tos-section-content">
              {renderContent(t('section14.content'))}
            </div>
          </section>

          {/* Section 15 */}
          <section className="mb-8">
            <h3 className="tos-section-title text-xl font-semibold mb-4">
              {t('section15.title')}
            </h3>
            <div className="tos-section-content">
              {renderContent(t('section15.content'))}
            </div>
          </section>

          {/* Section 16 */}
          <section className="mb-8">
            <h3 className="tos-section-title text-xl font-semibold mb-4">
              {t('section16.title')}
            </h3>
            <div className="tos-section-content">
              {renderContent(t('section16.content'))}
            </div>
          </section>

          {/* Section 17 */}
          <section className="mb-8">
            <h3 className="tos-section-title text-xl font-semibold mb-4">
              {t('section17.title')}
            </h3>
            <div className="tos-section-content">
              {renderContent(t('section17.content'))}
            </div>
          </section>

          {/* Section 18 */}
          <section className="mb-8">
            <h3 className="tos-section-title text-xl font-semibold mb-4">
              {t('section18.title')}
            </h3>
            <div className="tos-section-content">
              {renderContent(t('section18.content'))}
            </div>
          </section>

          {/* Section 19 */}
          <section className="mb-8">
            <h3 className="tos-section-title text-xl font-semibold mb-4">
              {t('section19.title')}
            </h3>
            <div className="tos-section-content">
              {renderContent(t('section19.content'))}
            </div>
          </section>

          {/* Section 20 */}
          <section className="mb-8">
            <h3 className="tos-section-title text-xl font-semibold mb-4">
              {t('section20.title')}
            </h3>
            <div className="tos-section-content">
              {renderContent(t('section20.content'))}
            </div>
          </section>

          {/* Section 21 */}
          <section className="mb-8">
            <h3 className="tos-section-title text-xl font-semibold mb-4">
              {t('section21.title')}
            </h3>
            <div className="tos-section-content">
              {renderContent(t('section21.content'))}
            </div>
          </section>

          {/* Section 22 */}
          <section className="mb-8">
            <h3 className="tos-section-title text-xl font-semibold mb-4">
              {t('section22.title')}
            </h3>
            <div className="tos-section-content">
              {renderContent(t('section22.content'))}
            </div>
          </section>

          {/* Section 23 */}
          <section className="mb-8">
            <h3 className="tos-section-title text-xl font-semibold mb-4">
              {t('section23.title')}
            </h3>
            <div className="tos-section-content">
              {renderContent(t('section23.content'))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default TOS;
