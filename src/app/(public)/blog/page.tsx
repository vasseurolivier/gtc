
export default function BlogPage() {
  const dictionary = {
    blogPage: {
      title: "Blog sur le Sourcing en Chine",
      content: "Nos articles et conseils sur l'import-export, le contrôle qualité et la logistique depuis la Chine seront bientôt disponibles..."
    }
  };

  return (
    <div className="container py-16 md:py-24">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-headline font-bold mb-8">
          {dictionary.blogPage.title}
        </h1>
        <div className="prose prose-lg max-w-none text-muted-foreground">
          <p>{dictionary.blogPage.content}</p>
        </div>
      </div>
    </div>
  );
}
