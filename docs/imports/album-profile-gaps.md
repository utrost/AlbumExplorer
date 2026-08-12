# Album profile gaps

Status: generated internal enrichment report, not public app content.

This report is derived from `data/app/album-atlas.json` and drives the next content-first enrichment passes. It should help Hermes choose which album profiles need better cover art, stories, tracklists, durations, and composer/songwriter/lyricist credits.

## Summary

- Albums: 760
- Albums with at least one profile gap: 718
- Missing cover art: 128
- Missing tracklists: 318
- Missing total duration: 394
- Missing composer/songwriter/lyricist credits: 515
- Missing useful story/context: 691

## How to use this report

Use the highest-ranked missing albums as input for the next enrichment pass:

1. Prefer second-pass Discogs matching when tracklist and cover art are missing.
2. Prefer Cover Art Archive when only cover art is missing.
3. Prefer Wikipedia/Wikidata when story/context is missing.
4. Prefer deeper MusicBrainz work-credit enrichment when tracklists exist but composer/songwriter/lyricist credits are absent.

Keep source work internal. The public app should continue to show album content and quiet footnotes, not this gap report.

## Top missing profiles by latest Rolling Stone rank

1. Marvin Gaye — *What's Going On* (1971)
   - latest rank #1
   - missing: story
   - recommended action: enrich-existing-tracklist-and-story

2. The Beach Boys — *Pet Sounds* (1966)
   - latest rank #2
   - missing: composerCredits, story
   - recommended action: enrich-existing-tracklist-and-story

3. Joni Mitchell — *Blue* (1971)
   - latest rank #3
   - missing: composerCredits, story
   - recommended action: enrich-existing-tracklist-and-story

4. Stevie Wonder — *Songs in the Key of Life* (1976)
   - latest rank #4
   - missing: story
   - recommended action: enrich-existing-tracklist-and-story

5. The Beatles — *Abbey Road* (1969)
   - latest rank #5
   - missing: totalDuration, story
   - recommended action: enrich-existing-tracklist-and-story

6. Nirvana — *Nevermind* (1991)
   - latest rank #6
   - missing: composerCredits, story
   - recommended action: enrich-existing-tracklist-and-story

7. Fleetwood Mac — *Rumours* (1977)
   - latest rank #7
   - missing: story
   - recommended action: enrich-existing-tracklist-and-story

8. Prince and the Revolution — *Purple Rain* (1984)
   - latest rank #8
   - missing: story
   - recommended action: enrich-existing-tracklist-and-story

9. The Clash — *London Calling* (1980)
   - latest rank #8
   - missing: story
   - recommended action: enrich-existing-tracklist-and-story

10. Bob Dylan — *Blood on the Tracks* (1975)
   - latest rank #9
   - missing: composerCredits, story
   - recommended action: enrich-existing-tracklist-and-story

11. Lauryn Hill — *The Miseducation of Lauryn Hill* (1998)
   - latest rank #10
   - missing: story
   - recommended action: enrich-existing-tracklist-and-story

12. The Beatles — *The Beatles ("The White Album")* (1968)
   - latest rank #10
   - missing: coverArt, tracklist, totalDuration, composerCredits, story
   - recommended action: fetch-album-content-sources

13. The Beatles — *The White Album* (1968)
   - latest rank #10
   - missing: coverArt, tracklist, totalDuration, composerCredits, story
   - recommended action: fetch-album-content-sources

14. Elvis Presley — *Sunrise* (1999)
   - latest rank #11
   - missing: composerCredits
   - recommended action: enrich-existing-tracklist-and-story

15. Elvis Presley — *The Sun Sessions* (1999)
   - latest rank #11
   - missing: coverArt, tracklist, totalDuration, composerCredits, story
   - recommended action: fetch-album-content-sources

16. The Beatles — *Revolver* (1966)
   - latest rank #11
   - missing: totalDuration, composerCredits, story
   - recommended action: enrich-existing-tracklist-and-story

17. Michael Jackson — *Thriller* (1982)
   - latest rank #12
   - missing: story
   - recommended action: enrich-existing-tracklist-and-story

18. Aretha Franklin — *I Never Loved a Man the Way I Love You* (1967)
   - latest rank #13
   - missing: story
   - recommended action: enrich-existing-tracklist-and-story

19. The Velvet Underground and Nico — *The Velvet Underground* (1967)
   - latest rank #13
   - missing: story
   - recommended action: enrich-existing-tracklist-and-story

20. The Rolling Stones — *Exile on Main Street* (1972)
   - latest rank #14
   - missing: story
   - recommended action: enrich-existing-tracklist-and-story

21. Public Enemy — *It Takes a Nation of Millions to Hold Us Back* (1988)
   - latest rank #15
   - missing: composerCredits, story
   - recommended action: enrich-existing-tracklist-and-story

22. The Clash — *London Calling* (1979)
   - latest rank #16
   - missing: story
   - recommended action: enrich-existing-tracklist-and-story

23. Kanye West — *My Beautiful Dark Twisted Fantasy* (2010)
   - latest rank #17
   - missing: composerCredits, story
   - recommended action: enrich-existing-tracklist-and-story

24. Bob Dylan — *Highway 61 Revisited* (1965)
   - latest rank #18
   - missing: composerCredits, story
   - recommended action: enrich-existing-tracklist-and-story

25. Radiohead — *Kid A* (2000)
   - latest rank #20
   - missing: story
   - recommended action: enrich-existing-tracklist-and-story

26. Bruce Springsteen — *Born to Run* (1975)
   - latest rank #21
   - missing: composerCredits, story
   - recommended action: enrich-existing-tracklist-and-story

27. Robert Johnson — *The Complete Recordings* (1990)
   - latest rank #22
   - missing: story
   - recommended action: enrich-existing-tracklist-and-story

28. The Notorious B.I.G. — *Ready to Die* (1994)
   - latest rank #22
   - missing: tracklist, totalDuration, composerCredits, story
   - recommended action: fetch-album-content-sources

29. John Lennon — *John Lennon/Plastic Ono Band* (1970)
   - latest rank #23
   - missing: totalDuration, composerCredits, story
   - recommended action: enrich-existing-tracklist-and-story

30. The Velvet Underground — *The Velvet Underground and Nico* (1967)
   - latest rank #23
   - missing: story
   - recommended action: enrich-existing-tracklist-and-story

31. The Beatles — *Sgt. Pepper's Lonely Hearts Club Band* (1967)
   - latest rank #24
   - missing: tracklist, totalDuration, composerCredits, story
   - recommended action: fetch-album-content-sources

32. Carole King — *Tapestry* (1971)
   - latest rank #25
   - missing: composerCredits, story
   - recommended action: enrich-existing-tracklist-and-story

33. Patti Smith — *Horses* (1975)
   - latest rank #26
   - missing: story
   - recommended action: enrich-existing-tracklist-and-story

34. Wu-Tang Clan — *Enter the Wu-Tang(36 Chambers)* (1993)
   - latest rank #27
   - missing: story
   - recommended action: enrich-existing-tracklist-and-story

35. D'Angelo — *Voodoo* (2000)
   - latest rank #28
   - missing: totalDuration, story
   - recommended action: enrich-existing-tracklist-and-story

36. The Beatles — *White Album* (1968)
   - latest rank #29
   - missing: coverArt, tracklist, totalDuration, composerCredits, story
   - recommended action: fetch-album-content-sources

37. Jimi Hendrix — *Are You Experienced* (1967)
   - latest rank #30
   - missing: totalDuration, composerCredits, story
   - recommended action: enrich-existing-tracklist-and-story

38. Miles Davis — *Kind of Blue* (1959)
   - latest rank #31
   - missing: composerCredits, story
   - recommended action: enrich-existing-tracklist-and-story

39. Beyoncé — *Lemonade* (2016)
   - latest rank #32
   - missing: story
   - recommended action: enrich-existing-tracklist-and-story

40. Amy Winehouse — *Back to Black* (2006)
   - latest rank #33
   - missing: tracklist, totalDuration, composerCredits, story
   - recommended action: fetch-album-content-sources

41. Stevie Wonder — *Innervisions* (1973)
   - latest rank #34
   - missing: composerCredits, story
   - recommended action: enrich-existing-tracklist-and-story

42. The Beatles — *Rubber Soul* (1965)
   - latest rank #35
   - missing: totalDuration, composerCredits, story
   - recommended action: enrich-existing-tracklist-and-story

43. Michael Jackson — *Off the Wall* (1979)
   - latest rank #36
   - missing: story
   - recommended action: enrich-existing-tracklist-and-story

44. Dr. Dre — *The Chronic* (1992)
   - latest rank #37
   - missing: story
   - recommended action: enrich-existing-tracklist-and-story

45. Bob Dylan — *Blonde on Blonde* (1966)
   - latest rank #38
   - missing: totalDuration, composerCredits, story
   - recommended action: enrich-existing-tracklist-and-story

46. Muddy Waters — *The Anthology (1947-1972)* (2001)
   - latest rank #38
   - missing: coverArt, tracklist, totalDuration, composerCredits, story
   - recommended action: fetch-album-content-sources

47. Talking Heads — *Remain in Light* (1980)
   - latest rank #39
   - missing: story
   - recommended action: enrich-existing-tracklist-and-story

48. The Beatles — *Please Please Me* (1963)
   - latest rank #39
   - missing: totalDuration, composerCredits, story
   - recommended action: enrich-existing-tracklist-and-story

49. David Bowie — *The Rise and Fall of Ziggy Stardust and the Spiders From Mars* (1972)
   - latest rank #40
   - missing: composerCredits, story
   - recommended action: enrich-existing-tracklist-and-story

50. The Rolling Stones — *Let It Bleed* (1969)
   - latest rank #41
   - missing: totalDuration, story
   - recommended action: enrich-existing-tracklist-and-story
