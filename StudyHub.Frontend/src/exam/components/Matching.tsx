import clsx from "clsx";
import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent
} from "react";
import type { Line, PermanentLine } from "../interfaces/models/Line";
import type { MatchingCard } from "../interfaces/models/MatchingCard";

interface CurrentMatches {
  [key: string]: number | string;
}

interface MatchingProps {
  initialTerms: string[];
  initialDefinitions: string[];
  questionNumber: number;
  currentMatches: CurrentMatches;
  handleChange: (key: number, value: number) => void;
}

interface CardProps {
  item: MatchingCard;
  type: 'term' | 'def';
  isMatched: boolean;
  onMouseDown?: (e: ReactMouseEvent<HTMLDivElement>, item: MatchingCard) => void;
}

interface Point {
  x: number;
  y: number;
}

interface DragState {
  item: MatchingCard;
  startPos: Point;
}

const Card = forwardRef<HTMLDivElement, CardProps>(({ item, type, isMatched, onMouseDown }, ref) => {
  const isTerm = type === 'term';

  return (
    <div
      ref={ref}
      id={item.id}
      data-match-id={isTerm ? undefined : item.id}
      className={clsx(
        'p-2 rounded-lg shadow-md border text-center transition-colors duration-300 flex items-center justify-center break-words whitespace-normal select-none h-full',
        isTerm ? 'cursor-grab' : '',
        isMatched ? 'bg-blue-100 border-blue-300' : 'border-gray-200'
      )}
      onMouseDown={isTerm && onMouseDown ? (e) => onMouseDown(e, item) : undefined}
    >
      {item.text}
    </div>
  );
});

Card.displayName = "Card";

const Matching = (props: MatchingProps) => {
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const processTerms: MatchingCard[] = props.initialTerms.map((t, index) => {
    return {
      id: `term-${props.questionNumber}-${index}`,
      index,
      text: t
    };
  });

  const processDefs: MatchingCard[] = props.initialDefinitions.map((d, index) => {
    return {
      id: `def-${props.questionNumber}-${index}`,
      index,
      text: d
    };
  });

  const [terms] = useState<MatchingCard[]>(processTerms);
  const [definitions] = useState<MatchingCard[]>(() => shuffleArray(processDefs));
  const [dragging, setDragging] = useState<DragState | null>(null);
  const [line, setLine] = useState<Line | null>(null);
  const [permanentLines, setPermanentLines] = useState<PermanentLine[]>([]);

  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const gameContainerRef = useRef<HTMLDivElement | null>(null);

  const getTermCardPoint = useCallback((id: string): Point => {
    const el = cardRefs.current[id];
    if (!el || !gameContainerRef.current) return { x: 0, y: 0 };

    const elRect = el.getBoundingClientRect();
    const containerRect = gameContainerRef.current.getBoundingClientRect();

    return {
      x: elRect.left - containerRect.left + elRect.width,
      y: elRect.top - containerRect.top + elRect.height / 2,
    };
  }, []);

  const getDefinitionCardPoint = useCallback((id: string): Point => {
    const el = cardRefs.current[id];
    if (!el || !gameContainerRef.current) return { x: 0, y: 0 };

    const elRect = el.getBoundingClientRect();
    const containerRect = gameContainerRef.current.getBoundingClientRect();

    return {
      x: elRect.left - containerRect.left,
      y: elRect.top - containerRect.top + elRect.height / 2,
    };
  }, []);

  useEffect(() => {
    const updateLines = () => {
      const entries = Object.entries(props.currentMatches || {});
      const filteredLines = entries.filter(([_, defVal]) => defVal !== -1);
      const newLines = filteredLines.map(([termKey, defVal]) => {
        const termIndex = parseInt(termKey, 10);
        let defIndex: number;

        // FIX: Explicitly handle string vs number to satisfy TypeScript
        if (typeof defVal === 'string' && defVal.startsWith('def-')) {
          defIndex = parseInt(defVal.split('-')[2], 10);
        } else {
          defIndex = parseInt(String(defVal), 10);
        }

        const termId = `term-${props.questionNumber}-${termIndex}`;
        const defId = `def-${props.questionNumber}-${defIndex}`;
        const start = getTermCardPoint(termId);
        const end = getDefinitionCardPoint(defId);
        return { x1: start.x, y1: start.y, x2: end.x, y2: end.y, id: `${termId}-${defId}` };
      });
      setPermanentLines(newLines);
    };

    // Small timeout ensures DOM has rendered before calculation
    const timer = setTimeout(updateLines, 0);
    window.addEventListener('resize', updateLines);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateLines);
    };
  }, [props.currentMatches, getTermCardPoint, getDefinitionCardPoint, props.questionNumber]);

  const handleMouseDown = (e: ReactMouseEvent<HTMLDivElement>, item: MatchingCard) => {
    e.preventDefault();
    const startPos = getTermCardPoint(item.id);
    setDragging({ item, startPos });
    setLine({ x1: startPos.x, y1: startPos.y, x2: startPos.x, y2: startPos.y });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging || !gameContainerRef.current) return;
    const containerRect = gameContainerRef.current.getBoundingClientRect();
    const xTemp = e.clientX - containerRect.left;
    const yTemp = e.clientY - containerRect.top;

    const startX = dragging.startPos?.x ?? 0;

    // Prevent line from going backwards (visual preference)
    if (startX - xTemp < 0) {
      setLine(prev => {
        if (!prev) return null;
        return {
          ...prev,
          x2: xTemp,
          y2: yTemp
        }
      });
    } else {
      setLine(prev => {
        if (!prev) return null;
        return {
          ...prev,
          x2: startX,
          y2: dragging.startPos?.y ?? prev.y1
        }
      });
    }
  }, [dragging]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!dragging) return;

    const dropTarget = document.elementFromPoint(e.clientX, e.clientY);
    const definitionCard = dropTarget?.closest('[data-match-id]') as HTMLElement | null;

    if (definitionCard && definitionCard.id.split('-')[1] == String(props.questionNumber)) {
      const droppedOnId = definitionCard.id;
      const defIndex = parseInt(droppedOnId.split('-')[2], 10);
      const termIndex = dragging.item.index;
      props.handleChange(termIndex, defIndex);
    }

    setDragging(null);
    setLine(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging, props.questionNumber, props.handleChange]);

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
  }, [dragging, handleMouseMove, handleMouseUp]);

  // Helper to check if a def item is matched
  const isDefMatched = (defIndex: number) => {
    const values = Object.values(props.currentMatches || {});
    // Check if the value matches the index directly OR if it matches a string format like "def-Q-IDX"
    return values.some(val => {
      if (typeof val === 'number') return val === defIndex;
      if (typeof val === 'string') {
        // Attempt to parse if it's a string ID
        if (val.startsWith('def-')) {
          const parsedIndex = parseInt(val.split('-')[2], 10);
          return parsedIndex === defIndex;
        }
        return parseInt(val, 10) === defIndex;
      }
      return false;
    });
  }

  return (
    <div className="w-1/2 mx-auto flex flex-col items-center justify-center p-8 font-sans">
      <div className="relative w-full" ref={gameContainerRef}>
        <div className="grid grid-cols-2 gap-20">
          <div className="flex flex-col space-y-4">
            {terms.map(item => (
              <Card
                key={item.id}
                ref={(el) => { cardRefs.current[item.id] = el; }}
                item={item}
                type="term"
                isMatched={props.currentMatches && props.currentMatches[item.index] !== undefined && props.currentMatches[item.index] !== -1}
                onMouseDown={handleMouseDown}
              />
            ))}
          </div>

          <div className="flex flex-col space-y-4">
            {definitions.map(item => (
              <Card
                key={item.id}
                ref={(el) => { cardRefs.current[item.id] = el; }}
                item={item}
                type="def"
                isMatched={isDefMatched(item.index)}
              />
            ))}
          </div>
        </div>

        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
          {permanentLines.map(line => (
            <line
              key={line.id}
              x1={line.x1} y1={line.y1}
              x2={line.x2} y2={line.y2}
              className="stroke-blue-500 stroke-[3px]"
            />
          ))}
          {line && (
            <line
              x1={line.x1} y1={line.y1}
              x2={line.x2} y2={line.y2}
              className="stroke-blue-500 stroke-[3px]"
            />
          )}
        </svg>
      </div>
    </div>
  )
}

export default Matching;