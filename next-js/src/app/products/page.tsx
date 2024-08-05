import { notFound } from "next/navigation";
import Products from "./Products";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Next JS",
};

const fetchData = async () => {
  const response = await fetch("https://swapi.dev/api/people", {
    cache: "force-cache",
  });
  const data = await response.json();
  return data;
};

export default async function Page() {
  console.log("Page");

  const data = await fetchData();

  if (!data) notFound();

  return <Products data={data} />;
}
