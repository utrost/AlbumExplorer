# Album profile gaps

Status: generated internal enrichment report, not public app content.

This report is derived from `data/app/album-atlas.json` and drives the next content-first enrichment passes. It should help Hermes choose which album profiles need better cover art, stories, tracklists, durations, and composer/songwriter/lyricist credits.

## Summary

- Albums: 760
- Albums with at least one profile gap: 705
- Missing cover art: 318
- Missing tracklists: 318
- Missing total duration: 394
- Missing composer/songwriter/lyricist credits: 515
- Missing useful story/context: 667

## How to use this report

Use the highest-ranked missing albums as input for the next enrichment pass:

1. Prefer second-pass Discogs matching when tracklist and cover art are missing.
2. Prefer Cover Art Archive when only cover art is missing.
3. Prefer Wikipedia/Wikidata when story/context is missing.
4. Prefer deeper MusicBrainz work-credit enrichment when tracklists exist but composer/songwriter/lyricist credits are absent.

Keep source work internal. The public app should continue to show album content and quiet footnotes, not this gap report.

## Top missing profiles by latest Rolling Stone rank

1. The Beach Boys — *Pet Sounds* (1966)
   - latest rank #2
   - missing: composerCredits, story
   - recommended action: enrich-existing-tracklist-and-story

2. Joni Mitchell — *Blue* (1971)
   - latest rank #3
   - missing: composerCredits, story
   - recommended action: enrich-existing-tracklist-and-story

3. Stevie Wonder — *Songs in the Key of Life* (1976)
   - latest rank #4
   - missing: story
   - recommended action: enrich-existing-tracklist-and-story

4. The Beatles — *Abbey Road* (1969)
   - latest rank #5
   - missing: totalDuration, story
   - recommended action: enrich-existing-tracklist-and-story

5. Nirvana — *Nevermind* (1991)
   - latest rank #6
   - missing: composerCredits, story
   - recommended action: enrich-existing-tracklist-and-story

6. Fleetwood Mac — *Rumours* (1977)
   - latest rank #7
   - missing: story
   - recommended action: enrich-existing-tracklist-and-story

7. Prince and the Revolution — *Purple Rain* (1984)
   - latest rank #8
   - missing: story
   - recommended action: enrich-existing-tracklist-and-story

8. The Clash — *London Calling* (1980)
   - latest rank #8
   - missing: story
   - recommended action: enrich-existing-tracklist-and-story

9. Bob Dylan — *Blood on the Tracks* (1975)
   - latest rank #9
   - missing: composerCredits, story
   - recommended action: enrich-existing-tracklist-and-story

10. Lauryn Hill — *The Miseducation of Lauryn Hill* (1998)
   - latest rank #10
   - missing: story
   - recommended action: enrich-existing-tracklist-and-story

11. The Beatles — *The Beatles ("The White Album")* (1968)
   - latest rank #10
   - missing: coverArt, tracklist, totalDuration, composerCredits, story
   - recommended action: fetch-album-content-sources

12. The Beatles — *The White Album* (1968)
   - latest rank #10
   - missing: coverArt, tracklist, totalDuration, composerCredits, story
   - recommended action: fetch-album-content-sources

13. Elvis Presley — *Sunrise* (1999)
   - latest rank #11
   - missing: composerCredits
   - recommended action: enrich-existing-tracklist-and-story

14. Elvis Presley — *The Sun Sessions* (1999)
   - latest rank #11
   - missing: coverArt, tracklist, totalDuration, composerCredits, story
   - recommended action: fetch-album-content-sources

15. The Beatles — *Revolver* (1966)
   - latest rank #11
   - missing: totalDuration, composerCredits, story
   - recommended action: enrich-existing-tracklist-and-story

16. Michael Jackson — *Thriller* (1982)
   - latest rank #12
   - missing: story
   - recommended action: enrich-existing-tracklist-and-story

17. Aretha Franklin — *I Never Loved a Man the Way I Love You* (1967)
   - latest rank #13
   - missing: story
   - recommended action: enrich-existing-tracklist-and-story

18. The Velvet Underground and Nico — *The Velvet Underground* (1967)
   - latest rank #13
   - missing: story
   - recommended action: enrich-existing-tracklist-and-story

19. The Rolling Stones — *Exile on Main Street* (1972)
   - latest rank #14
   - missing: story
   - recommended action: enrich-existing-tracklist-and-story

20. Public Enemy — *It Takes a Nation of Millions to Hold Us Back* (1988)
   - latest rank #15
   - missing: composerCredits, story
   - recommended action: enrich-existing-tracklist-and-story

21. The Clash — *London Calling* (1979)
   - latest rank #16
   - missing: story
   - recommended action: enrich-existing-tracklist-and-story

22. Kanye West — *My Beautiful Dark Twisted Fantasy* (2010)
   - latest rank #17
   - missing: composerCredits, story
   - recommended action: enrich-existing-tracklist-and-story

23. Bob Dylan — *Highway 61 Revisited* (1965)
   - latest rank #18
   - missing: composerCredits, story
   - recommended action: enrich-existing-tracklist-and-story

24. Radiohead — *Kid A* (2000)
   - latest rank #20
   - missing: story
   - recommended action: enrich-existing-tracklist-and-story

25. Bruce Springsteen — *Born to Run* (1975)
   - latest rank #21
   - missing: composerCredits, story
   - recommended action: enrich-existing-tracklist-and-story

26. Robert Johnson — *The Complete Recordings* (1990)
   - latest rank #22
   - missing: story
   - recommended action: enrich-existing-tracklist-and-story

27. The Notorious B.I.G. — *Ready to Die* (1994)
   - latest rank #22
   - missing: coverArt, tracklist, totalDuration, composerCredits, story
   - recommended action: fetch-album-content-sources

28. John Lennon — *John Lennon/Plastic Ono Band* (1970)
   - latest rank #23
   - missing: totalDuration, composerCredits
   - recommended action: enrich-existing-tracklist-and-story

29. The Velvet Underground — *The Velvet Underground and Nico* (1967)
   - latest rank #23
   - missing: story
   - recommended action: enrich-existing-tracklist-and-story

30. The Beatles — *Sgt. Pepper's Lonely Hearts Club Band* (1967)
   - latest rank #24
   - missing: coverArt, tracklist, totalDuration, composerCredits, story
   - recommended action: fetch-album-content-sources

31. Carole King — *Tapestry* (1971)
   - latest rank #25
   - missing: composerCredits, story
   - recommended action: enrich-existing-tracklist-and-story

32. Patti Smith — *Horses* (1975)
   - latest rank #26
   - missing: story
   - recommended action: enrich-existing-tracklist-and-story

33. Wu-Tang Clan — *Enter the Wu-Tang(36 Chambers)* (1993)
   - latest rank #27
   - missing: story
   - recommended action: enrich-existing-tracklist-and-story

34. D'Angelo — *Voodoo* (2000)
   - latest rank #28
   - missing: totalDuration, story
   - recommended action: enrich-existing-tracklist-and-story

35. The Beatles — *White Album* (1968)
   - latest rank #29
   - missing: coverArt, tracklist, totalDuration, composerCredits, story
   - recommended action: fetch-album-content-sources

36. Jimi Hendrix — *Are You Experienced* (1967)
   - latest rank #30
   - missing: totalDuration, composerCredits, story
   - recommended action: enrich-existing-tracklist-and-story

37. Miles Davis — *Kind of Blue* (1959)
   - latest rank #31
   - missing: composerCredits, story
   - recommended action: enrich-existing-tracklist-and-story

38. Beyoncé — *Lemonade* (2016)
   - latest rank #32
   - missing: story
   - recommended action: enrich-existing-tracklist-and-story

39. Amy Winehouse — *Back to Black* (2006)
   - latest rank #33
   - missing: coverArt, tracklist, totalDuration, composerCredits, story
   - recommended action: fetch-album-content-sources

40. Stevie Wonder — *Innervisions* (1973)
   - latest rank #34
   - missing: composerCredits, story
   - recommended action: enrich-existing-tracklist-and-story

41. The Beatles — *Rubber Soul* (1965)
   - latest rank #35
   - missing: totalDuration, composerCredits, story
   - recommended action: enrich-existing-tracklist-and-story

42. Michael Jackson — *Off the Wall* (1979)
   - latest rank #36
   - missing: story
   - recommended action: enrich-existing-tracklist-and-story

43. Dr. Dre — *The Chronic* (1992)
   - latest rank #37
   - missing: story
   - recommended action: enrich-existing-tracklist-and-story

44. Bob Dylan — *Blonde on Blonde* (1966)
   - latest rank #38
   - missing: totalDuration, composerCredits, story
   - recommended action: enrich-existing-tracklist-and-story

45. Muddy Waters — *The Anthology (1947-1972)* (2001)
   - latest rank #38
   - missing: coverArt, tracklist, totalDuration, composerCredits, story
   - recommended action: fetch-album-content-sources

46. Talking Heads — *Remain in Light* (1980)
   - latest rank #39
   - missing: story
   - recommended action: enrich-existing-tracklist-and-story

47. The Beatles — *Please Please Me* (1963)
   - latest rank #39
   - missing: totalDuration, composerCredits, story
   - recommended action: enrich-existing-tracklist-and-story

48. David Bowie — *The Rise and Fall of Ziggy Stardust and the Spiders From Mars* (1972)
   - latest rank #40
   - missing: composerCredits, story
   - recommended action: enrich-existing-tracklist-and-story

49. The Rolling Stones — *Let It Bleed* (1969)
   - latest rank #41
   - missing: totalDuration, story
   - recommended action: enrich-existing-tracklist-and-story

50. Radiohead — *OK Computer* (1997)
   - latest rank #42
   - missing: totalDuration, composerCredits, story
   - recommended action: enrich-existing-tracklist-and-story
