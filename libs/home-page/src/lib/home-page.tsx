import React from "react";
import styled from "@emotion/styled";
import Link from "next/link";

/* eslint-disable-next-line */
export interface HomePageProps {}

const StyledHomePage = styled.div`
  color: pink;
`;

export const HomePage = (props: HomePageProps) => {
  return (
    <StyledHomePage>
      <h1>Welcome to home-page!</h1>
      <Link href="/">
        <a>Go to landing</a>
      </Link>
    </StyledHomePage>
  );
};
