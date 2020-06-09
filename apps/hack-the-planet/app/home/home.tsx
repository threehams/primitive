import React from "react";

import styled from "@emotion/styled";

const StyledHome = styled.div`
  color: pink;
`;

export const Home = () => {
  return (
    <StyledHome>
      <h1>Welcome to Home!</h1>
    </StyledHome>
  );
};

export default Home;
