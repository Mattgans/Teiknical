# Python 3.10+ and Node.js 20.12+ must be downloaded prior

```bash
make setup
make pipeline
make dashboard
```

In github codespaces, open port 5173 from the ports panel.

Open [Dashboard](http://localhost:5173) for Dashboard.

## Dashboard Notes

Built with React + Vite + Material UI.

Kept very minimal on purpose with different tabs for each sections data to ensure that that data was layed out in a easy to access manner.

## Back End Notes

Performed all tasks required. Inital confusion for part 2 if SQL was required or if other methods (pandas) was allowed. Both solutions were provided.

Part 3 mentions that we should compare the differences in cell population relative frequencies of melanoma patients receiving miraclib who respond (responders) versus those who do not (non-responders), with the overarching aim of predicting response to the treatment miraclib. The overarching aim was mentioned here but was never asked to do a prediction itself so no model was built. Mentioned in my comments in code that logistic regression would be the ideal choice here as the output goal is a predictive yes/no output. I calculated percentages as averaged per subject across treatment days so repeated samples are not treated as independent patients. Welch's t-tests compare the response groups, with Holm correction across the 5 cell populations.