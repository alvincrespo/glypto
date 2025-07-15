#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { JSDOM } from 'jsdom';
import { createScraper } from './factory.js';

const program = new Command();

program
  .name('glypto')
  .description('A CLI tool for scraping webpage metadata')
  .version('1.0.0');

program
  .command('scrape')
  .description('Scrape metadata from a webpage')
  .action(async () => {
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(
      chalk.blue('Enter the URL to scrape metadata from: '),
      async (url) => {
        rl.close();

        try {
          console.log(chalk.yellow(`Fetching metadata from: ${url}`));

          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const html = await response.text();
          const dom = new JSDOM(html);
          const document = dom.window.document;

          const scraper = await createScraper();
          const metadata = await scraper.scrape(document);

          console.log(chalk.green('\n✓ Metadata scraped successfully:\n'));

          console.log(chalk.bold('Title:'), metadata.title || 'Not found');
          console.log(
            chalk.bold('Description:'),
            metadata.description || 'Not found'
          );
          console.log(chalk.bold('Image:'), metadata.image || 'Not found');
          console.log(chalk.bold('URL:'), metadata.url || 'Not found');
          console.log(
            chalk.bold('Site Name:'),
            metadata.siteName || 'Not found'
          );
          console.log(chalk.bold('Favicon:'), metadata.favicon);

          if (metadata.feeds.length > 0) {
            console.log(chalk.bold('\nFeeds:'));
            metadata.feeds.forEach((feed, index) => {
              console.log(
                `  ${index + 1}. ${feed.title || 'Untitled'} (${feed.type}) - ${feed.href}`
              );
            });
          }

          if (metadata.openGraph.size > 0) {
            console.log(chalk.bold('\nOpen Graph Tags:'));
            for (const [key, values] of metadata.openGraph) {
              console.log(`  ${key}: ${values.join(', ')}`);
            }
          }

          if (metadata.twitterCard.size > 0) {
            console.log(chalk.bold('\nTwitter Card Tags:'));
            for (const [key, values] of metadata.twitterCard) {
              console.log(`  ${key}: ${values.join(', ')}`);
            }
          }
        } catch (error) {
          console.error(
            chalk.red('Error:'),
            error instanceof Error ? error.message : 'Unknown error'
          );
          process.exit(1);
        }
      }
    );
  });

if (process.argv.length === 2) {
  program.help();
} else {
  program.parse();
}
